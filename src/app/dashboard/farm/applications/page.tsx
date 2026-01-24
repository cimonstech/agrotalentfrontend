'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

export default function FarmApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    job_id: ''
  })

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getApplications()
      let apps = data.applications || []
      
      // Filter by status
      if (filters.status) {
        apps = apps.filter((app: any) => app.status === filters.status)
      }
      
      // Filter by job
      if (filters.job_id) {
        apps = apps.filter((app: any) => app.job_id === filters.job_id)
      }

      // Sort by match score
      apps.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))
      
      setApplications(apps)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      await apiClient.updateApplication(applicationId, { status })
      fetchApplications()
    } catch (error) {
      console.error('Failed to update application:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage job applications</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => setFilters({ status: '', job_id: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No applications found</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {app.jobs?.title} • {app.jobs?.location}
                    </p>
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
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{app.cover_letter}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
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
