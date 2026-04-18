'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { ContactSubmission } from '@/types'

const supabase = createSupabaseClient()

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Failed to fetch contact submissions:', error)
        setSubmissions([])
      } else {
        setSubmissions((data as ContactSubmission[]) ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch contact submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSubmissions()
  }, [])

  const markReplied = async (submissionId: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({
        status: 'replied',
        replied_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
    if (error) {
      console.error(error)
      return
    }
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: 'replied', replied_at: new Date().toISOString() }
          : s
      )
    )
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
                    {submission.status !== 'replied' && (
                      <button
                        type="button"
                        onClick={() => void markReplied(submission.id)}
                        className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Mark as replied
                      </button>
                    )}
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
