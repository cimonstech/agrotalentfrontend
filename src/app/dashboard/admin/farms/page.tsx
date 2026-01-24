'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'

export default function AdminFarmsPage() {
  const [farms, setFarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filters, setFilters] = useState({
    region: '',
    verified: '',
    search: ''
  })

  useEffect(() => {
    fetchFarms()
  }, [filters])

  const fetchFarms = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getAdminUsers({ role: 'farm', ...filters })
      setFarms(data.users || [])
    } catch (error: any) {
      console.error('Failed to fetch farms:', error)
      setError(error.message || 'Failed to fetch farms')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (farmId: string, verified: boolean) => {
    try {
      await apiClient.verifyUser(farmId, verified)
      fetchFarms()
    } catch (error: any) {
      alert(error.message || 'Failed to update verification')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Employers/Farms Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employer/farm accounts, validate job requests, and track placements</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <input
            type="text"
            placeholder="Search employers/farms..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          />
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Regions</option>
            <option value="Greater Accra">Greater Accra</option>
            <option value="Ashanti">Ashanti</option>
            <option value="Western">Western</option>
            <option value="Eastern">Eastern</option>
            <option value="Central">Central</option>
            <option value="Volta">Volta</option>
            <option value="Northern">Northern</option>
          </select>
          <select
            value={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
          <button
            onClick={() => setFilters({ region: '', verified: '', search: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading farms...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {farms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No farms found
                      </td>
                    </tr>
                  ) : (
                    farms.map((farm) => (
                      <tr key={farm.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{farm.farm_name || 'No name'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{farm.email}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{farm.full_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {farm.farm_type?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {farm.farm_location || farm.location || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {farm.is_verified ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {!farm.is_verified && (
                              <button
                                onClick={() => handleVerify(farm.id, true)}
                                className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            <Link
                              href={`/dashboard/admin/users/${farm.id}`}
                              className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
