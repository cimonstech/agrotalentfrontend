'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminContact()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Failed to fetch contact submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Form Submissions</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage contact form submissions</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No contact submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{submission.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{submission.email}</p>
                    {submission.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{submission.phone}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                    submission.status === 'read' ? 'bg-blue-100 text-blue-800' :
                    submission.status === 'replied' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
                {submission.subject && (
                  <p className="font-medium text-gray-900 dark:text-white mb-2">Subject: {submission.subject}</p>
                )}
                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{submission.message}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${submission.email}`}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Reply
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
