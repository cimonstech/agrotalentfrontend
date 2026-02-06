'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Job {
  id: string
  title: string
  description: string
  job_type: string
  location: string
  address?: string
  salary_min?: number
  salary_max?: number
  required_qualification?: string
  required_institution_type?: string
  required_experience_years?: number
  required_specialization?: string
  created_at: string
  profiles?: {
    id: string
    farm_name: string
    farm_type: string
    farm_location: string
  }
}

export default function JobDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = params.id as string
  const showApplyForm = searchParams.get('apply') === 'true'

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyError, setApplyError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    fetchJob()
    checkAuth()
  }, [jobId])

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const fetchJob = async () => {
    if (!jobId) {
      setLoading(false)
      setError('Invalid job ID')
      return
    }
    try {
      setLoading(true)
      setError('')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(`/api/jobs?id=${jobId}`, { signal: controller.signal })
      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job')
      }

      // If API returns array, get first item
      const jobData = Array.isArray(data.jobs) ? data.jobs[0] : data.job
      setJob(jobData ?? null)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(err?.message || 'Failed to load job')
      }
      setJob(null)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplyError('')
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/jobs/${jobId}?apply=true`)
      return
    }

    // Validate jobId
    if (!jobId) {
      setError('Invalid job ID. Please try again.')
      return
    }

    setApplying(true)
    setError('')

    try {
      console.log('[JobDetailPage] Applying for job:', jobId)
      await apiClient.createApplication({
        job_id: jobId,
        cover_letter: coverLetter || null
      })

      setApplicationSuccess(true)
      setTimeout(() => {
        // Try to determine user role and redirect accordingly
        const supabase = createSupabaseClient()
        supabase.auth.getSession().then(({ data: { session } }) => {
          const role = session?.user?.user_metadata?.role
          if (role === 'student') {
            router.push('/dashboard/student')
          } else if (role === 'skilled') {
            router.push('/dashboard/skilled')
          } else {
            router.push('/dashboard/graduate')
          }
        }).catch(() => {
          router.push('/dashboard/graduate')
        })
      }, 2000)
    } catch (err: any) {
      console.error('[JobDetailPage] Application error:', err)
      // Provide more specific error messages
      let errorMessage = 'Failed to apply. '
      if (err.message?.includes('already applied')) {
        errorMessage += 'You have already applied for this job.'
      } else if (err.message?.includes('verified')) {
        errorMessage += 'Your profile must be verified before applying.'
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        errorMessage += 'Please sign in and try again.'
      } else if (err.message?.includes('Job ID is required')) {
        errorMessage += 'Invalid job. Please try again.'
      } else {
        errorMessage += err.message || 'Please make sure you are logged in and your profile is verified.'
      }
      setApplyError(errorMessage)
    } finally {
      setApplying(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `GHS ${min.toLocaleString()} - ${max.toLocaleString()}/month`
    if (min) return `GHS ${min.toLocaleString()}+/month`
    return `Up to GHS ${max?.toLocaleString()}/month`
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${jobId}` : ''
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setLinkCopied(false)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${jobId}` : ''
    const title = job ? `${job.title} | AgroTalent Hub` : 'Agricultural Job | AgroTalent Hub'
    const text = job
      ? `${job.title} at ${job.profiles?.farm_name || 'Farm'} - ${job.location}. Apply on AgroTalent Hub.`
      : 'Check out this agricultural job on AgroTalent Hub.'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const formatJobType = (type: string) => {
    const types: Record<string, string> = {
      farm_hand: 'Farm Hand',
      farm_manager: 'Farm Manager',
      intern: 'Intern',
      nss: 'NSS',
      data_collector: 'Data Collector'
    }
    return types[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This job does not exist or has been removed.'}</p>
          <Link href="/jobs" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Browse All Jobs
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/jobs" className="hover:text-primary">Jobs</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {job.profiles?.farm_name || 'Farm'} • {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium"
                    aria-label="Share job link"
                  >
                    {linkCopied ? (
                      <>
                        <i className="fas fa-check text-green-600 dark:text-green-400"></i>
                        Link copied!
                      </>
                    ) : (
                      <>
                        <i className="fas fa-share-alt"></i>
                        Share
                      </>
                    )}
                  </button>
                  <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                    {formatJobType(job.job_type)}
                  </span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-8">
                <h2 className="text-xl font-bold mb-4">Job Description</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                <h2 className="text-xl font-bold mb-4">Requirements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.required_qualification && (
                    <div className="flex items-start gap-3">
                      <i className="fas fa-graduation-cap text-primary mt-1"></i>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Qualification</p>
                        <p className="text-gray-600 dark:text-gray-400">{job.required_qualification}</p>
                      </div>
                    </div>
                  )}
                  {job.required_institution_type && (
                    <div className="flex items-start gap-3">
                      <i className="fas fa-university text-primary mt-1"></i>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Institution Type</p>
                        <p className="text-gray-600 dark:text-gray-400 capitalize">{job.required_institution_type}</p>
                      </div>
                    </div>
                  )}
                  {job.required_experience_years !== undefined && (
                    <div className="flex items-start gap-3">
                      <i className="fas fa-briefcase text-primary mt-1"></i>
                      <div>
                                               <p className="font-medium text-gray-900 dark:text-white">Experience</p>
                        <p className="text-gray-600 dark:text-gray-400">{job.required_experience_years} year{job.required_experience_years !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}
                  {job.required_specialization && (
                    <div className="flex items-start gap-3">
                      <i className="fas fa-tag text-primary mt-1"></i>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Specialization</p>
                        <p className="text-gray-600 dark:text-gray-400 capitalize">{job.required_specialization}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Apply Form */}
            {showApplyForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10 mt-6"
              >
                {applicationSuccess ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Your application has been submitted successfully. Redirecting to your dashboard...
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Apply for this Position</h2>
                    {applyError && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg mb-6">
                        {applyError}
                      </div>
                    )}
                    <form onSubmit={handleApply}>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cover Letter (Optional)
                        </label>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="Tell the employer why you're a good fit for this position..."
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={applying}
                          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {applying ? (
                            <span className="flex items-center justify-center">
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Submitting...
                            </span>
                          ) : (
                            'Submit Application'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 sticky top-24"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Job Details</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</p>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-primary"></i>
                    {job.location}
                  </p>
                  {job.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">{job.address}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Salary</p>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fas fa-money-bill-wave text-primary"></i>
                    {formatSalary(job.salary_min, job.salary_max)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Posted</p>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <i className="fas fa-clock text-primary"></i>
                    {new Date(job.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {job.profiles?.farm_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Farm Type</p>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {job.profiles.farm_type.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>

              {!showApplyForm && (
                <>
                  {checkingAuth ? (
                    <div className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg font-medium text-center mb-3 cursor-not-allowed">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Checking...
                    </div>
                  ) : isAuthenticated ? (
                    <Link
                      href={`/jobs/${jobId}?apply=true`}
                      className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors text-center mb-3"
                    >
                      Apply Now
                    </Link>
                  ) : (
                    <Link
                      href={`/signin?redirect=/jobs/${jobId}?apply=true`}
                      className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors text-center mb-3"
                    >
                      Sign In to Apply
                    </Link>
                  )}
                </>
              )}
              
              <Link
                href="/jobs"
                className="block w-full px-6 py-3 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors text-center"
              >
                Browse More Jobs
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
