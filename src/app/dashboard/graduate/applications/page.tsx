'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GraduateApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications')
      const data = await response.json()

      if (response.ok) {
        let apps = data.applications || []
        
        if (filter) {
          apps = apps.filter((app: any) => app.status === filter)
        }

        setApplications(apps)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Track the status of your job applications</p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-file-alt text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No applications yet</p>
            <Link
              href="/dashboard/graduate/jobs"
              className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {app.jobs?.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {app.jobs?.profiles?.farm_name} • {app.jobs?.location}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span><i className="fas fa-money-bill-wave mr-1"></i> GHS {app.jobs?.salary_min?.toLocaleString() || 'N/A'} - {app.jobs?.salary_max?.toLocaleString() || 'N/A'}</span>
                      <span><i className="fas fa-clock mr-1"></i> Applied {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <Link
                  href={`/dashboard/graduate/applications/${app.id}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
