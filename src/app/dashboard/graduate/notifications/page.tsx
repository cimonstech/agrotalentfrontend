'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      // Use apiClient which includes auth headers
      const data = await apiClient.getNotifications(filter === 'unread')
      setNotifications(data.notifications || [])
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      // Use apiClient for authenticated request
      await apiClient.markNotificationsRead(notificationIds)
      fetchNotifications()
    } catch (error: any) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      // Use apiClient for authenticated request
      await apiClient.markNotificationsRead(undefined, true)
      fetchNotifications()
    } catch (error: any) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">Stay updated on your applications and opportunities</p>
          </div>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
            </select>
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Mark All Read
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-bell-slash text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 ${
                  !notif.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{notif.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead([notif.id])}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
