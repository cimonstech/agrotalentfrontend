'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function SkilledApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[SkilledApplications] Session error:', sessionError)
      }
      
      if (!session) {
        console.warn('[SkilledApplications] No session found, redirecting to signin')
        router.push('/signin')
        return
      }

      // Ensure we have an access token
      let accessToken = session.access_token
      if (!accessToken) {
        console.warn('[SkilledApplications] No access token, attempting refresh')
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshedSession?.access_token) {
          console.error('[SkilledApplications] Failed to refresh session:', refreshError)
          router.push('/signin')
          return
        }
        accessToken = refreshedSession.access_token
      }

      console.log('[SkilledApplications] Using access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NONE')

      // Pass the token directly to apiClient to avoid retrieval issues
      const data = await apiClient.getApplications(accessToken)
      setApplications(data.applications || [])
    } catch (error: any) {
      console.error('[SkilledApplications] Failed to fetch applications:', error)
      // If 401, redirect to signin
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        router.push('/signin')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'shortlisted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/skilled" className="text-accent hover:text-accent/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your job applications and their status</p>
        </div>

        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center"
          >
            <i className="fas fa-clipboard-list text-6xl text-gray-300 dark:text-gray-700 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Applications Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't applied to any jobs yet. Start browsing opportunities to find your next role.
            </p>
            <Link
              href="/dashboard/skilled/jobs"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Browse Jobs
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {app.job?.title || 'Job Title'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {app.job?.farm_name || 'Farm Name'} • {app.job?.location || 'Location'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Pending'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/skilled/applications/${app.id}`}
                    className="px-4 py-2 text-accent hover:bg-accent/10 rounded-lg transition-colors font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
