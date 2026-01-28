'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

export default function FarmApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 25

  useEffect(() => {
    fetchApplicants()
  }, [page])

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getApplicants({ page, limit })
      setApplicants(data.applicants || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      applicant.full_name?.toLowerCase().includes(searchLower) ||
      applicant.email?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading applicants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Applicants</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all applicants who have applied for your jobs
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {filteredApplicants.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-users text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No applicants found matching your search' : 'No applicants found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applicants List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedApplicant?.id === applicant.id
                      ? 'ring-2 ring-primary border-primary'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {applicant.full_name}
                        </h3>
                        {applicant.is_verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <i className="fas fa-check-circle mr-1"></i>
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        <i className="fas fa-envelope mr-2"></i>
                        {applicant.email}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          <i className="fas fa-file-alt mr-1"></i>
                          {applicant.total_applications} application{applicant.total_applications !== 1 ? 's' : ''}
                        </span>
                        {applicant.latest_application_date && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <i className="fas fa-clock mr-1"></i>
                            Last applied: {new Date(applicant.latest_application_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Applicant Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedApplicant ? (
                <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6 sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Applicant Details
                    </h2>
                    <button
                      onClick={() => setSelectedApplicant(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {selectedApplicant.full_name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Email:</span> {selectedApplicant.email}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status:</span>{' '}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedApplicant.is_verified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {selectedApplicant.is_verified ? 'Verified' : 'Not Verified'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Applications ({selectedApplicant.total_applications})
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedApplicant.applications.map((app: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
                          >
                            <p className="font-medium text-gray-900 dark:text-white mb-1">
                              {app.job_title}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                  app.status
                                )}`}
                              >
                                {app.status}
                              </span>
                              {app.match_score && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  Match: {app.match_score}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Applied: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                            <Link
                              href={`/dashboard/farm/applications/${app.id}`}
                              className="text-primary hover:text-primary/80 text-xs mt-2 inline-block"
                            >
                              View Application <i className="fas fa-arrow-right ml-1"></i>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-user-circle text-4xl mb-3"></i>
                  <p>Select an applicant to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
