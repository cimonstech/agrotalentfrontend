'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
]

export default function AdminRegionsPage() {
  const [regionStats, setRegionStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('')

  useEffect(() => {
    fetchRegionStats()
  }, [selectedRegion])

  const fetchRegionStats = async () => {
    try {
      setLoading(true)
      // Note: This endpoint needs to be created
      const response = await fetch('/api/admin/regions/stats?' + new URLSearchParams({
        ...(selectedRegion && { region: selectedRegion })
      }))
      if (response.ok) {
        const data = await response.json()
        setRegionStats(data.stats || [])
      } else {
        // Fallback: Calculate from users data
        const usersData = await apiClient.getAdminUsers({})
        const users = usersData.users || []
        
        const stats = REGIONS.map(region => {
          const regionUsers = users.filter((u: any) => 
            u.preferred_region === region || u.farm_location === region || u.location === region
          )
          const farms = regionUsers.filter((u: any) => u.role === 'farm').length
          const graduates = regionUsers.filter((u: any) => u.role === 'graduate').length
          const students = regionUsers.filter((u: any) => u.role === 'student').length
          
          return {
            region,
            total_users: regionUsers.length,
            farms,
            graduates,
            students
          }
        }).filter(s => s.total_users > 0)
        
        setRegionStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch region stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Regions & Location Control</h1>
          <p className="text-gray-600 dark:text-gray-400">Enforce regional placement policy and track users by region</p>
        </div>

        {/* Region Filter */}
        <div className="bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Regions</option>
            {REGIONS.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading region statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionStats.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <i className="fas fa-map-marker-alt text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">No regional data found</p>
              </div>
            ) : (
              regionStats.map((stat) => (
                <motion.div
                  key={stat.region}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{stat.region}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.total_users || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Farms</span>
                      <span className="text-lg font-medium text-primary">{stat.farms || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Graduates</span>
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">{stat.graduates || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Students</span>
                      <span className="text-lg font-medium text-blue-600 dark:text-blue-400">{stat.students || 0}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    View Details
                  </button>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
