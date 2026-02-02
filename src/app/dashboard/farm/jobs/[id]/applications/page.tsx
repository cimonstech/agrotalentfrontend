'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function JobApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [applications, setApplications] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }
      
      // Fetch job using apiClient
      try {
        const jobData = await apiClient.getJobs({ id: jobId })
        setJob(jobData.job || jobData.jobs?.[0])
      } catch (error) {
        console.error('Failed to fetch job:', error)
      }

      // Fetch applications using apiClient
      try {
        const appsData = await apiClient.getApplications()
        const jobApps = appsData.applications?.filter((app: any) => app.job_id === jobId) || []
        jobApps.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))
        setApplications(jobApps)
      } catch (error) {
        console.error('Failed to fetch applications:', error)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      // Use apiClient for authenticated request
      await apiClient.updateApplication(applicationId, { status })
      fetchData()
    } catch (error: any) {
      console.error('Failed to update application:', error)
      alert(error.message || 'Failed to update application')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <Link href={`/dashboard/farm/jobs/${jobId}`} className="text-primary hover:text-primary/80 mb-6 inline-block">
          ← Back to Job
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Applications for {job?.title || 'Job'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {applications.length} application{applications.length !== 1 ? 's' : ''} • Sorted by match score
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No applications for this job yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {app.applicant?.full_name || 'Applicant'}
                      </h3>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                        {app.match_score || 0}% Match
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span><i className="fas fa-graduation-cap mr-1"></i> {app.applicant?.qualification || 'N/A'}</span>
                      <span><i className="fas fa-map-marker-alt mr-1"></i> {app.applicant?.preferred_region || 'N/A'}</span>
                      {app.applicant?.is_verified && (
                        <span className="text-green-600 dark:text-green-400">
                          <i className="fas fa-check-circle mr-1"></i> Verified
                        </span>
                      )}
                    </div>
                    {app.cover_letter && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">{app.cover_letter}</p>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(app.id, 'accepted')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <Link
                    href={`/dashboard/farm/applications/${app.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
