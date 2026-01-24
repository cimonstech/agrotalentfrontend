'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

export default function AdminPlacementsPage() {
  const [placements, setPlacements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    region: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  useEffect(() => {
    fetchPlacements()
  }, [filters, pagination.page])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminPlacements({
        status: filters.status,
        region: filters.region,
        page: pagination.page,
        limit: pagination.limit
      })

      setPlacements(data.placements || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0
      }))
    } catch (error) {
      console.error('Failed to fetch placements:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Placements</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage all placements across the platform</p>
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
            <option value="training">Training</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>
          <input
            type="text"
            placeholder="Filter by region..."
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setFilters({ status: '', region: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading placements...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Graduate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {placements.map((placement) => (
                    <tr key={placement.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{placement.graduate?.full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{placement.graduate?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{placement.farm?.farm_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{placement.farm?.farm_location}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{placement.jobs?.title || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{placement.jobs?.location}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          placement.status === 'active' ? 'bg-green-100 text-green-800' :
                          placement.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          placement.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {placement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {placement.recruitment_fee_paid ? (
                          <span className="text-green-600 dark:text-green-400 text-sm">Paid</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400 text-sm">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(placement.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
