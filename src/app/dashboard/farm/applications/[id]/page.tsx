'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string
  const [application, setApplication] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  useEffect(() => {
    if (applicationId) {
      fetchApplicantDocuments()
    }
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      setLoading(true)

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      // Use apiClient which includes auth headers
      const data = await apiClient.getApplications()
      const app = data.applications?.find((a: any) => a.id === applicationId)
      setApplication(app)
    } catch (error: any) {
      console.error('Failed to fetch application:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicantDocuments = async () => {
    try {
      setDocumentsLoading(true)
      const data = await apiClient.getApplicantDocuments(applicationId)
      setDocuments(data.documents || [])
    } catch (error: any) {
      console.error('Failed to fetch applicant documents:', error)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      // Use apiClient for authenticated request
      await apiClient.updateApplication(applicationId, { status })
      router.push('/dashboard/farm/applications')
    } catch (error: any) {
      console.error('Failed to update application:', error)
      alert(error.message || 'Failed to update application')
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
          <Link href="/dashboard/farm/applications" className="text-primary hover:text-primary/80">
            ← Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <Link href="/dashboard/farm/applications" className="text-primary hover:text-primary/80 mb-6 inline-block">
          ← Back to Applications
        </Link>

        <div className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Application from {application.applicant?.full_name || 'Applicant'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{application.jobs?.title}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {application.status}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">Applicant Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-medium">{application.applicant?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{application.applicant?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Qualification</p>
                  <p className="font-medium">{application.applicant?.qualification || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Region</p>
                  <p className="font-medium">{application.applicant?.preferred_region || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Institution</p>
                  <p className="font-medium">{application.applicant?.institution_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
                  <p className="font-medium text-primary">{application.match_score || 0}%</p>
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div>
              <h2 className="text-lg font-bold mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium">{application.jobs?.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Job Type</p>
                  <p className="font-medium">{application.jobs?.job_type ? application.jobs.job_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Salary</p>
                  <p className="font-medium">
                    {application.jobs?.salary_min && application.jobs?.salary_max
                      ? `GHS ${application.jobs.salary_min.toLocaleString()} - ${application.jobs.salary_max.toLocaleString()}`
                      : application.jobs?.salary_min
                      ? `GHS ${application.jobs.salary_min.toLocaleString()}`
                      : 'GHS N/A - N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
                  <p className="font-medium text-primary">{application.match_score || 0}%</p>
                </div>
              </div>
              {application.jobs?.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Job Description</p>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{application.jobs.description}</p>
                  </div>
                </div>
              )}
            </div>

            {application.cover_letter && (
              <div>
                <h2 className="text-lg font-bold mb-4">Cover Letter</h2>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{application.cover_letter}</p>
                </div>
              </div>
            )}

            {/* Applicant Documents (from My Documents) */}
            <div>
              <h2 className="text-lg font-bold mb-4">Applicant Documents</h2>
              {documentsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <i className="fas fa-spinner fa-spin mr-2"></i>Loading documents...
                </p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded by applicant.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.file_name || doc.document_type}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {doc.document_type?.replace('_', ' ')}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm whitespace-nowrap"
                      >
                        <i className="fas fa-external-link-alt mr-1"></i> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {application.status === 'pending' && (
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => handleStatusChange('accepted')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Accept Application
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
