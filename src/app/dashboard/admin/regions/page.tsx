'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { GHANA_REGIONS } from '@/lib/utils'

const supabase = createSupabaseClient()

type RegionStat = {
  region: string
  workerCount: number
  farmCount: number
  activeJobCount: number
}

export default function AdminRegionsPage() {
  const [regionStats, setRegionStats] = useState<RegionStat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [profilesRes, jobsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('preferred_region, farm_location, role'),
          supabase.from('jobs').select('location, status'),
        ])
        if (cancelled) return
        const profiles = (profilesRes.data as Pick<
          Profile,
          'preferred_region' | 'farm_location' | 'role'
        >[]) ?? []
        const jobs =
          (jobsRes.data as { location: string | null; status: string }[]) ?? []

        const stats: RegionStat[] = GHANA_REGIONS.map((region) => {
          const workerCount = profiles.filter(
            (p) =>
              p.preferred_region === region &&
              (p.role === 'graduate' ||
                p.role === 'student' ||
                p.role === 'skilled')
          ).length
          const farmCount = profiles.filter(
            (p) => p.farm_location === region && p.role === 'farm'
          ).length
          const activeJobCount = jobs.filter(
            (j) => j.location === region && j.status === 'active'
          ).length
          return { region, workerCount, farmCount, activeJobCount }
        })

        setRegionStats(stats)
      } catch (error) {
        console.error('Failed to fetch region stats:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const displayStats = useMemo(() => {
    const withData = regionStats.filter(
      (s) =>
        s.workerCount > 0 || s.farmCount > 0 || s.activeJobCount > 0
    )
    if (selectedRegion) {
      return withData.filter((s) => s.region === selectedRegion)
    }
    return withData
  }, [regionStats, selectedRegion])

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
            {GHANA_REGIONS.map((region) => (
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
            {displayStats.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <i className="fas fa-map-marker-alt text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">No regional data found</p>
              </div>
            ) : (
              displayStats.map((stat) => (
                <motion.div
                  key={stat.region}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{stat.region}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Workers (graduates, students, skilled)</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.workerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Farms</span>
                      <span className="text-lg font-medium text-primary">{stat.farmCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active jobs</span>
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">{stat.activeJobCount}</span>
                    </div>
                  </div>
                  <button type="button" className="mt-4 w-full px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
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
