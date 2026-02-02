'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function SkilledDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    profileStrength: 0
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

  const calculateProfileStrength = (prof: any) => {
    let strength = 0
    const checks = [
      prof?.full_name,
      prof?.phone,
      prof?.years_of_experience,
      prof?.experience_description,
      prof?.crops_experience?.length > 0,
      prof?.livestock_experience?.length > 0,
      prof?.skills,
      prof?.preferred_region,
      prof?.reference_name && prof?.reference_phone
    ]
    strength = (checks.filter(Boolean).length / checks.length) * 100
    return Math.round(strength)
  }

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

      // Load critical data first for faster initial render
      const [profileResult, applicationsResult] = await Promise.allSettled([
        apiClient.getProfile(),
        apiClient.getApplications()
      ])

      // Process profile data
      if (profileResult.status === 'fulfilled') {
        const profileData = profileResult.value
        setProfile(profileData.profile)
        setStats(prev => ({
          ...prev,
          profileStrength: calculateProfileStrength(profileData.profile)
        }))
      } else {
        console.error('Failed to fetch profile:', profileResult.reason)
      }

      // Process applications data
      if (applicationsResult.status === 'fulfilled') {
        const appsData = applicationsResult.value
        setApplications(appsData.applications?.slice(0, 5) || [])
        setStats(prev => ({
          ...prev,
          totalApplications: appsData.applications?.length || 0,
          pendingApplications: appsData.applications?.filter((a: any) => a.status === 'pending').length || 0,
          acceptedApplications: appsData.applications?.filter((a: any) => a.status === 'accepted').length || 0,
        }))
      } else {
        console.error('Failed to fetch applications:', applicationsResult.reason)
      }

      // Defer non-critical data to speed up initial paint
      const loadSecondaryData = async () => {
        try {
          const [matchesResult, notificationsResult] = await Promise.allSettled([
            apiClient.getMatches(),
            apiClient.getNotifications(true)
          ])

          if (matchesResult.status === 'fulfilled') {
            setMatchedJobs(matchesResult.value.matches?.slice(0, 5) || [])
          }

          if (notificationsResult.status === 'fulfilled') {
            setNotifications(notificationsResult.value.notifications?.slice(0, 5) || [])
          }
        } catch (err) {
          // Silently fail for secondary data
        }
      }

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(loadSecondaryData, { timeout: 2000 })
      } else {
        setTimeout(loadSecondaryData, 100)
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
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isVerified = profile?.is_verified
  const profileStrength = stats.profileStrength

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 lg:ml-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find farm opportunities that match your skills and experience
          </p>
        </div>

        {/* Verification Banner */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <i className="fas fa-exclamation-triangle text-2xl text-yellow-600 dark:text-yellow-400"></i>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Profile Verification Pending</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your profile is under review. You'll be able to apply to jobs once verified.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Strength Banner */}
        {profileStrength < 80 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <i className="fas fa-chart-line text-2xl text-accent"></i>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Profile Strength: {profileStrength}%</h3>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${profileStrength}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete your profile to increase your chances of getting hired
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/skilled/profile"
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Complete Profile
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Profile Strength', value: `${profileStrength}%`, icon: 'user-check', color: 'accent', gradient: true },
            { label: 'Total Applications', value: stats.totalApplications, icon: 'file-alt', color: 'blue' },
            { label: 'Pending Reviews', value: stats.pendingApplications, icon: 'clock', color: 'orange' },
            { label: 'Job Offers', value: stats.acceptedApplications, icon: 'handshake', color: 'green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 ${
                stat.gradient ? 'bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${
                  stat.color === 'accent' 
                    ? 'bg-accent/20' 
                    : `bg-${stat.color}-100 dark:bg-${stat.color}-900/30`
                } rounded-lg flex items-center justify-center`}>
                  <i className={`fas fa-${stat.icon} ${
                    stat.color === 'accent'
                      ? 'text-accent'
                      : `text-${stat.color}-600 dark:text-${stat.color}-400`
                  } text-xl`}></i>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Matched Jobs */}
          <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <i className="fas fa-briefcase text-accent"></i>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job Matches</h2>
              </div>
              <Link href="/dashboard/skilled/jobs" className="text-accent hover:text-accent/80 text-sm font-medium">
                Browse All →
              </Link>
            </div>
            <div className="space-y-4">
              {matchedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-gray-500 mb-4">No job matches found yet</p>
                  <Link
                    href="/dashboard/skilled/jobs"
                    className="inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                matchedJobs.map((match) => (
                  <div key={match.job_id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{match.job?.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <i className="fas fa-building text-xs mr-1"></i>
                          {match.job?.profiles?.farm_name} • {match.job?.location}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-bold whitespace-nowrap">
                        {match.match_score}% match
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/skilled/jobs/${match.job_id}`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      {isVerified && (
                        <Link
                          href={`/dashboard/skilled/jobs/${match.job_id}?apply=true`}
                          className="flex-1 px-3 py-2 bg-accent text-white rounded text-sm hover:bg-accent/90 transition-colors text-center"
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
              <div className="flex items-center gap-2">
                <i className="fas fa-file-alt text-accent"></i>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h2>
              </div>
              <Link href="/dashboard/skilled/applications" className="text-accent hover:text-accent/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-clipboard-list text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Link
                    href="/dashboard/skilled/jobs"
                    className="inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Find Jobs
                  </Link>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{app.jobs?.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <i className="fas fa-building text-xs mr-1"></i>
                          {app.jobs?.profiles?.farm_name} • {app.jobs?.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <i className="fas fa-clock mr-1"></i>
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/skilled/applications/${app.id}`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-center"
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

        {/* Experience Highlights */}
        {profile && (
          <div className="mt-8 bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20 rounded-xl p-6 border border-accent/30">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <i className="fas fa-star text-accent"></i>
              Your Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/50 dark:bg-background-dark/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fas fa-calendar-alt text-accent text-xl"></i>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile.years_of_experience || 0} Years
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 dark:bg-background-dark/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Crops Experience</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile.crops_experience?.length || 0} Types
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 dark:bg-background-dark/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fas fa-paw text-accent text-xl"></i>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Livestock Experience</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile.livestock_experience?.length || 0} Types
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {profile.skills && (
              <div className="mt-4 bg-white/50 dark:bg-background-dark/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Skills</p>
                <p className="text-gray-900 dark:text-white">{profile.skills}</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mt-8 bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <i className="fas fa-bell text-accent"></i>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Notifications</h2>
              </div>
              <Link href="/dashboard/skilled/notifications" className="text-accent hover:text-accent/80 text-sm font-medium">
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
              href="/dashboard/skilled/jobs"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-accent/10 hover:border-accent transition-colors text-center group"
            >
              <i className="fas fa-search text-2xl text-accent mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Find Jobs</p>
            </Link>
            <Link
              href="/dashboard/skilled/applications"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-accent/10 hover:border-accent transition-colors text-center group"
            >
              <i className="fas fa-file-alt text-2xl text-accent mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Applications</p>
            </Link>
            <Link
              href="/dashboard/skilled/profile"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-accent/10 hover:border-accent transition-colors text-center group"
            >
              <i className="fas fa-user-cog text-2xl text-accent mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</p>
            </Link>
            <Link
              href="/dashboard/skilled/training"
              className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-accent/10 hover:border-accent transition-colors text-center group"
            >
              <i className="fas fa-graduation-cap text-2xl text-accent mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Training</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
