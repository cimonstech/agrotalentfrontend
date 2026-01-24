'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function GraduateDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    activePlacements: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get auth token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      }

      // Use backend API directly (not Next.js proxy)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      // Fetch profile
      const profileRes = await fetch(`${API_URL}/api/profile`, { headers })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.profile)
      }

      // Fetch applications
      const appsRes = await fetch(`${API_URL}/api/applications`, { headers })
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData.applications?.slice(0, 5) || [])
        setStats({
          totalApplications: appsData.applications?.length || 0,
          pendingApplications: appsData.applications?.filter((a: any) => a.status === 'pending').length || 0,
          acceptedApplications: appsData.applications?.filter((a: any) => a.status === 'accepted').length || 0,
          activePlacements: 0 // Will be calculated from placements
        })
      }

      // Fetch matched jobs
      const matchesRes = await fetch(`${API_URL}/api/matches`, { headers })
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        setMatchedJobs(matchesData.matches?.slice(0, 5) || [])
      }

      // Fetch notifications
      const notifRes = await fetch(`${API_URL}/api/notifications?unread=true`, { headers })
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setNotifications(notifData.notifications?.slice(0, 5) || [])
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

  const isVerified = profile?.is_verified

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 lg:ml-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Find opportunities and manage your applications</p>
        </div>

        {/* Verification Banner */}
        {!isVerified && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <i className="fas fa-exclamation-triangle text-2xl text-yellow-600 dark:text-yellow-400"></i>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Profile Verification Pending</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your profile is under review. You'll be able to apply to jobs once verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: stats.totalApplications, icon: 'file-alt', color: 'blue' },
            { label: 'Pending', value: stats.pendingApplications, icon: 'clock', color: 'orange' },
            { label: 'Accepted', value: stats.acceptedApplications, icon: 'check-circle', color: 'green' },
            { label: 'Active Placements', value: stats.activePlacements, icon: 'handshake', color: 'purple' }
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
          {/* Matched Jobs */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job Matches</h2>
              <Link href="/dashboard/graduate/jobs" className="text-primary hover:text-primary/80 text-sm font-medium">
                Browse All →
              </Link>
            </div>
            <div className="space-y-4">
              {matchedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No job matches found</p>
                  <Link
                    href="/dashboard/graduate/jobs"
                    className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                matchedJobs.map((match) => (
                  <div key={match.job_id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{match.job?.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {match.job?.profiles?.farm_name} • {match.job?.location}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {match.match_score}% match
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/graduate/jobs/${match.job_id}`}
                        className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        View Details
                      </Link>
                      {isVerified && (
                        <Link
                          href={`/dashboard/graduate/jobs/${match.job_id}?apply=true`}
                          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
                        >
                          Apply Now
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Applications */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h2>
              <Link href="/dashboard/graduate/applications" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Link
                    href="/dashboard/graduate/jobs"
                    className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{app.jobs?.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {app.jobs?.profiles?.farm_name} • {app.jobs?.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/graduate/applications/${app.id}`}
                        className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mt-8 bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Notifications</h2>
              <Link href="/dashboard/graduate/notifications" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/graduate/jobs"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-search text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Browse Jobs</p>
            </Link>
            <Link
              href="/dashboard/graduate/applications"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-file-alt text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">My Applications</p>
            </Link>
            <Link
              href="/dashboard/graduate/profile"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-user-cog text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Edit Profile</p>
            </Link>
            <Link
              href="/dashboard/graduate/messages"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-center"
            >
              <i className="fas fa-envelope text-2xl text-primary mb-2"></i>
              <p className="text-sm font-medium">Messages</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
