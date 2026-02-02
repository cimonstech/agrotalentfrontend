'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

interface DashboardStats {
  total_users: number
  farms: number
  graduates: number
  students: number
  verified_users: number
  active_jobs: number
  total_applications: number
  active_placements: number
  completed_placements: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [recentPlacements, setRecentPlacements] = useState<any[]>([])
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    let mounted = true

    const fetchData = async () => {
      if (!mounted) return
      await fetchDashboardData()
    }

    fetchData()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }

      // Parallelize all independent API calls for better performance
      const [reportResult, usersResult, placementsResult] = await Promise.allSettled([
        apiClient.getAdminReports('overview'),
        apiClient.getAdminUsers({ verified: 'false', limit: 10 }),
        apiClient.getAdminPlacements({ limit: 5 })
      ])

      // Process report data
      if (reportResult.status === 'fulfilled') {
        const reportData = reportResult.value
        if (reportData?.report?.overview) {
          setStats(reportData.report.overview)
        } else if (reportData?.report) {
          if (reportData.report.total_users !== undefined) {
            setStats(reportData.report as DashboardStats)
          } else {
            setStats({
              total_users: 0,
              farms: 0,
              graduates: 0,
              students: 0,
              verified_users: 0,
              active_jobs: 0,
              total_applications: 0,
              active_placements: 0,
              completed_placements: 0
            })
          }
        } else {
          setStats({
            total_users: 0,
            farms: 0,
            graduates: 0,
            students: 0,
            verified_users: 0,
            active_jobs: 0,
            total_applications: 0,
            active_placements: 0,
            completed_placements: 0
          })
        }
      } else {
        console.error('Failed to fetch reports:', reportResult.reason)
        setError(`Failed to load statistics: ${reportResult.reason?.message || 'Unknown error'}`)
        setStats({
          total_users: 0,
          farms: 0,
          graduates: 0,
          students: 0,
          verified_users: 0,
          active_jobs: 0,
          total_applications: 0,
          active_placements: 0,
          completed_placements: 0
        })
      }

      // Process pending verifications
      if (usersResult.status === 'fulfilled') {
        setPendingVerifications(usersResult.value.users || [])
      } else {
        console.error('Failed to fetch pending verifications:', usersResult.reason)
      }

      // Process recent placements
      if (placementsResult.status === 'fulfilled') {
        setRecentPlacements(placementsResult.value.placements || [])
      } else {
        console.error('Failed to fetch placements:', placementsResult.reason)
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId: string, verified: boolean) => {
    setVerifyingUserId(userId)
    setError('')
    setSuccessMessage(null)
    try {
      await apiClient.verifyUser(userId, verified)
      apiClient.clearCache('/api/admin')
      if (verified) {
        setPendingVerifications((prev) => prev.filter((u) => u.id !== userId))
        setStats((prev) =>
          prev ? { ...prev, verified_users: (prev.verified_users || 0) + 1 } : null
        )
        setSuccessMessage('User verified successfully.')
      } else {
        setPendingVerifications((prev) => prev.filter((u) => u.id !== userId))
        setSuccessMessage('Verification rejected.')
      }
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      console.error('Failed to verify user:', err)
      setError(err?.message || 'Failed to verify user. Please try again.')
    } finally {
      setVerifyingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 lg:ml-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, placements, and system operations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
              <button
                onClick={fetchDashboardData}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats?.total_users || 0, icon: 'users', color: 'blue' },
            { label: 'Farms', value: stats?.farms || 0, icon: 'building', color: 'green' },
            { label: 'Graduates', value: stats?.graduates || 0, icon: 'graduation-cap', color: 'purple' },
            { label: 'Active Jobs', value: stats?.active_jobs || 0, icon: 'briefcase', color: 'orange' },
            { label: 'Applications', value: stats?.total_applications || 0, icon: 'file-alt', color: 'indigo' },
            { label: 'Active Placements', value: stats?.active_placements || 0, icon: 'handshake', color: 'teal' },
            { label: 'Verified Users', value: stats?.verified_users || 0, icon: 'check-circle', color: 'green' },
            { label: 'Completed', value: stats?.completed_placements || 0, icon: 'check-double', color: 'emerald' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg flex items-center justify-center`}>
                  <i className={`fas fa-${stat.icon} text-${stat.color}-600 dark:text-${stat.color}-400 text-xl`}></i>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Verifications */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Verifications</h2>
              <Link href="/dashboard/admin/users" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {pendingVerifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending verifications</p>
              ) : (
                pendingVerifications.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(user.role === 'farm' ? 'Employer/Farm' : user.role === 'worker' ? 'Worker' : user.role)} • {user.institution_name || user.farm_name || 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(user.id, true)}
                        disabled={verifyingUserId !== null}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifyingUserId === user.id ? (
                          <span className="flex items-center gap-2">
                            <i className="fas fa-spinner fa-spin"></i> Verifying…
                          </span>
                        ) : (
                          'Verify'
                        )}
                      </button>
                      <button
                        onClick={() => handleVerify(user.id, false)}
                        disabled={verifyingUserId !== null}
                        className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Placements */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Placements</h2>
              <Link href="/dashboard/admin/placements" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {recentPlacements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent placements</p>
              ) : (
                recentPlacements.map((placement) => (
                  <div key={placement.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {placement.graduate?.full_name || 'Graduate'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {placement.jobs?.title} at {placement.farm?.farm_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        placement.status === 'active' ? 'bg-green-100 text-green-800' :
                        placement.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {placement.status}
                      </span>
                      <span>{new Date(placement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admin/users"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-users text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Manage Users</p>
            </Link>
            <Link
              href="/dashboard/admin/placements"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-handshake text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">View Placements</p>
            </Link>
            <Link
              href="/dashboard/admin/reports"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-chart-bar text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">View Reports</p>
            </Link>
            <Link
              href="/dashboard/admin/contact"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-envelope text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Contact Forms</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
