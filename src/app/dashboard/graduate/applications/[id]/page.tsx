'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function GraduateApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.id as string
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications')
      const data = await response.json()

      if (response.ok) {
        const app = data.applications?.find((a: any) => a.id === applicationId)
        setApplication(app)
      }
    } catch (error) {
      console.error('Failed to fetch application:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Application not found</p>
          <Link href="/dashboard/graduate/applications" className="text-primary hover:text-primary/80">
            ← Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <Link href="/dashboard/graduate/applications" className="text-primary hover:text-primary/80 mb-6 inline-block">
          ← Back to Applications
        </Link>

        <div className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {application.jobs?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{application.jobs?.profiles?.farm_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
              application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {application.status}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium">{application.jobs?.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salary</p>
                  <p className="font-medium">GHS {application.jobs?.salary_min?.toLocaleString() || 'N/A'} - {application.jobs?.salary_max?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Job Type</p>
                  <p className="font-medium capitalize">{application.jobs?.job_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
                  <p className="font-medium text-primary">{application.match_score || 0}%</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">Job Description</h2>
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{application.jobs?.description}</p>
              </div>
            </div>

            {application.cover_letter && (
              <div>
                <h2 className="text-lg font-bold mb-4">Your Cover Letter</h2>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{application.cover_letter}</p>
                </div>
              </div>
            )}

            {application.review_notes && (
              <div>
                <h2 className="text-lg font-bold mb-4">Review Notes</h2>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{application.review_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
