'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function FarmDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    activePlacements: 0
  })
  const [loading, setLoading] = useState(true)

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

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }

      // Fetch profile first (needed for farm_id filter)
      let currentProfile = null
      try {
        const profileData = await apiClient.getProfile()
        currentProfile = profileData.profile
        setProfile(currentProfile)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }

      // Parallelize independent API calls for better performance
      const [jobsResult, applicationsResult] = await Promise.allSettled([
        apiClient.getJobs(currentProfile?.id ? { farm_id: currentProfile.id } : undefined),
        apiClient.getApplications()
      ])

      // Process jobs data
      if (jobsResult.status === 'fulfilled') {
        const jobsData = jobsResult.value
        const farmJobs = currentProfile?.id 
          ? (jobsData.jobs || []).filter((j: any) => j.farm_id === currentProfile.id)
          : (jobsData.jobs || [])
        setJobs(farmJobs.slice(0, 5))
        setStats(prev => ({ 
          ...prev, 
          activeJobs: farmJobs.filter((j: any) => j.status === 'active').length 
        }))
      } else {
        console.error('Failed to fetch jobs:', jobsResult.reason)
      }

      // Process applications data
      if (applicationsResult.status === 'fulfilled') {
        const appsData = applicationsResult.value
        setApplications(appsData.applications?.slice(0, 5) || [])
        setStats(prev => ({
          ...prev,
          totalApplications: appsData.applications?.length || 0,
          pendingApplications: appsData.applications?.filter((a: any) => a.status === 'pending').length || 0
        }))
      } else {
        console.error('Failed to fetch applications:', applicationsResult.reason)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome{profile?.farm_name ? `, ${profile.farm_name}` : ''}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your job postings and applications</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Jobs', value: stats.activeJobs, icon: 'briefcase', color: 'blue' },
            { label: 'Total Applications', value: stats.totalApplications, icon: 'file-alt', color: 'purple' },
            { label: 'Pending Review', value: stats.pendingApplications, icon: 'clock', color: 'orange' },
            { label: 'Active Placements', value: stats.activePlacements, icon: 'handshake', color: 'green' }
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
          {/* Recent Applications */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Applications</h2>
              <Link href="/dashboard/farm/applications" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No applications yet</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {app.applicant?.full_name || 'Applicant'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {app.jobs?.title} • Match Score: {app.match_score || 0}%
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/farm/applications/${app.id}`}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Jobs</h2>
              <Link href="/dashboard/farm/jobs/new" className="text-primary hover:text-primary/80 text-sm font-medium">
                Post New Job →
              </Link>
            </div>
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No jobs posted yet</p>
                  <Link
                    href="/dashboard/farm/jobs/new"
                    className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Post Your First Job
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {job.location} • {job.application_count || 0} applications
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'filled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/farm/jobs/${job.id}`}
                        className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/farm/jobs/${job.id}/applications`}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
                      >
                        Applications ({job.application_count || 0})
                      </Link>
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
              href="/dashboard/farm/jobs/new"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-plus-circle text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Post Job</p>
            </Link>
            <Link
              href="/dashboard/farm/applications"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-file-alt text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">View Applications</p>
            </Link>
            <Link
              href="/dashboard/farm/placements"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-handshake text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Placements</p>
            </Link>
            <Link
              href="/dashboard/farm/profile"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-user-cog text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Profile Settings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
