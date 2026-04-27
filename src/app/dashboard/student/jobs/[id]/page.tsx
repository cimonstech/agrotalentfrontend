'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'
import { markBrowseJobsComplete } from '@/lib/mark-browse-jobs'
import type { Job } from '@/types'
import JobBenefits from '@/components/dashboard/JobBenefits'

const supabase = createSupabaseClient()

type PageJob = Job & {
  profiles?: {
    id: string
    farm_name: string
    full_name?: string
    farm_type: string
    farm_location: string
  } | null
}

export default function StudentJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<PageJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [existingApp, setExistingApp] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    fetchJob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (cancelled) return
      markBrowseJobsComplete(auth.user?.id ?? null)
      const user = auth.user
      if (!user) {
        setExistingApp(null)
        return
      }
      const { data: appData } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setExistingApp(
          appData ? { id: appData.id as string, status: appData.status as string } : null
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [jobId])

  const fetchJob = async () => {
    try {
      setLoading(true)
      setError('')
      // Use apiClient to fetch job
      const data = await apiClient.getJobs({ id: jobId })
      setJob(data.job || data.jobs?.[0])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch job')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `GHS ${min.toLocaleString()} - ${max.toLocaleString()}/month`
    if (min) return `GHS ${min.toLocaleString()}+/month`
    return `Up to GHS ${max?.toLocaleString()}/month`
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
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading job...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This job does not exist or has been removed.'}</p>
          <Link href="/dashboard/student/jobs" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors inline-block">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-10">
        <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/dashboard/student" className="hover:text-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href="/dashboard/student/jobs" className="hover:text-primary">Jobs</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {(job.is_platform_job
                      ? 'AgroTalent Hub'
                      : job.profiles?.farm_name ?? job.profiles?.full_name ?? 'Unknown Farm')}{' '}
                    • {job.location}
                  </p>
                </div>
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                  {formatJobType(job.job_type)}
                </span>
              </div>

              <h2 className='mb-3 text-xl font-bold'>Job Description</h2>
              <div
                className='prose prose-sm max-w-none text-gray-600 prose-headings:text-forest prose-strong:text-gray-800 prose-li:text-gray-600 prose-a:text-brand'
                dangerouslySetInnerHTML={{ __html: job.description ?? '' }}
              />
              {job.responsibilities ? (
                <div>
                  <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                    Responsibilities
                  </h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                    dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                  />
                </div>
              ) : null}
              {job.requirements ? (
                <div>
                  <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                    Requirements
                  </h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </div>
              ) : null}
              <JobBenefits job={job} />

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
                  {job.required_experience_years !== null && job.required_experience_years !== undefined && (
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
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Summary</h2>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Salary</span>
                  <span className="font-medium text-right">{formatSalary(job.salary_min, job.salary_max)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Posted</span>
                  <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.address && (
                  <div className="pt-2">
                    <p className="text-gray-500 mb-1">Address</p>
                    <p className="text-gray-700 dark:text-gray-300">{job.address}</p>
                  </div>
                )}
              </div>

              <div className='mt-6'>
                {existingApp ? (
                  <div className='rounded-2xl border border-green-100 bg-green-50 p-5'>
                    <p className='text-sm font-semibold text-green-700'>Already Applied</p>
                    <p className='mt-1 text-xs text-green-600'>
                      Status: {existingApp.status}
                    </p>
                  </div>
                ) : (
                  <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                    <h3 className='mb-3 font-bold text-gray-900'>Apply for this Position</h3>
                    <p className='mb-4 text-sm text-gray-500'>
                      Complete your application with your CV and eligibility details.
                    </p>
                    <Link
                      href={'/jobs/' + jobId + '/apply'}
                      className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-bold text-white transition-colors hover:bg-forest'
                    >
                      Start Application
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

