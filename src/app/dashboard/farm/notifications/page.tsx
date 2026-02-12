'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

const DASHBOARD_ROLES = ['graduate', 'student', 'farm', 'skilled', 'admin']

function normalizeNotificationLink(link: string | null | undefined, pathname: string): string {
  if (!link || !link.startsWith('/dashboard/')) return link || '#'
  const parts = link.split('/').filter(Boolean)
  if (parts.length < 2) return link
  if (DASHBOARD_ROLES.includes(parts[1])) return link
  const role = pathname.split('/')[2] || 'farm'
  return `/dashboard/${role}${link.replace(/^\/dashboard/, '')}`
}

const NOTICE_ID_UUID = /\/notices\/([0-9a-f-]{36})/i
const isNoticeType = (type: string) => type === 'notice' || type === 'training_notice'

function getNotificationDetailHref(notif: any, pathname: string): string {
  const role = pathname.split('/')[2] || 'farm'
  const dashboardRole = role === 'student' ? 'graduate' : role
  if (isNoticeType(notif.type)) {
    const id = notif.notice_id || (notif.link && (notif.link.match(NOTICE_ID_UUID)?.[1]))
    if (id) return `/dashboard/${dashboardRole}/notices/${id}`
  }
  return normalizeNotificationLink(notif.link, pathname)
}

export default function FarmNotificationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }
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
      await apiClient.markNotificationsRead(notificationIds)
      fetchNotifications()
      window.dispatchEvent(new CustomEvent('notifications-updated'))
    } catch (error: any) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markNotificationsRead(undefined, true)
      fetchNotifications()
      window.dispatchEvent(new CustomEvent('notifications-updated'))
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
                    {(() => {
                      const href = getNotificationDetailHref(notif, pathname)
                      const hasNoticeId = isNoticeType(notif.type) && (notif.notice_id || notif.link?.match(NOTICE_ID_UUID))
                      const showLink = isNoticeType(notif.type) ? true : !!notif.link
                      const role = pathname.split('/')[2] || 'farm'
                      const dashboardRole = role === 'student' ? 'graduate' : role
                      const detailHref = (isNoticeType(notif.type) && hasNoticeId && NOTICE_ID_UUID.test(href))
                        ? href
                        : isNoticeType(notif.type)
                          ? `/dashboard/${dashboardRole}/notices/from-notification/${notif.id}`
                          : normalizeNotificationLink(notif.link, pathname)
                      if (!showLink) return null
                      return (
                        <Link
                          href={detailHref || `/dashboard/${dashboardRole}/notifications`}
                          className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                        >
                          View Details →
                        </Link>
                      )
                    })()}
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
