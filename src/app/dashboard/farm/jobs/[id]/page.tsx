'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FarmJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs?id=${jobId}`)
      const data = await response.json()

      if (response.ok) {
        setJob(data.job)
      }
    } catch (error) {
      console.error('Failed to fetch job:', error)
    } finally {
      setLoading(false)
    }
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

  if (!job) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Job not found</p>
          <Link href="/dashboard/farm" className="text-primary hover:text-primary/80">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <Link href="/dashboard/farm" className="text-primary hover:text-primary/80 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{job.location}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              job.status === 'active' ? 'bg-green-100 text-green-800' :
              job.status === 'filled' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">Job Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Job Type</p>
                  <p className="font-medium capitalize">{job.job_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salary</p>
                  <p className="font-medium">
                    {job.salary_min && job.salary_max
                      ? `GHS ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/month`
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
                  <p className="font-medium">{job.application_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
              <Link
                href={`/dashboard/farm/jobs/${jobId}/applications`}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View Applications ({job.application_count || 0})
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
