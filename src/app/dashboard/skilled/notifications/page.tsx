'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

const DASHBOARD_ROLES = ['graduate', 'student', 'farm', 'skilled', 'admin']

function normalizeNotificationLink(link: string | null | undefined, pathname: string): string {
  if (!link || !link.startsWith('/dashboard/')) return link || '#'
  const parts = link.split('/').filter(Boolean)
  if (parts.length < 2) return link
  if (DASHBOARD_ROLES.includes(parts[1])) return link
  const role = pathname.split('/')[2] || 'skilled'
  return `/dashboard/${role}${link.replace(/^\/dashboard/, '')}`
}

const NOTICE_ID_UUID = /\/notices\/([0-9a-f-]{36})/i
const isNoticeType = (type: string) => type === 'notice' || type === 'training_notice'

function getNotificationDetailHref(notif: any, pathname: string): string {
  const role = pathname.split('/')[2] || 'skilled'
  const dashboardRole = role === 'student' ? 'graduate' : role
  if (isNoticeType(notif.type)) {
    const id = notif.notice_id || (notif.link && (notif.link.match(NOTICE_ID_UUID)?.[1]))
    if (id) return `/dashboard/${dashboardRole}/notices/${id}`
  }
  return normalizeNotificationLink(notif.link, pathname)
}

export default function SkilledNotificationsPage() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.getNotifications()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationsRead([id])
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      window.dispatchEvent(new CustomEvent('notifications-updated'))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Stay updated on your applications and opportunities</p>
        </div>

        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center"
          >
            <i className="fas fa-bell-slash text-6xl text-gray-300 dark:text-gray-700 mb-6"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You're all caught up! We'll notify you when there are updates.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  bg-white dark:bg-background-dark border rounded-xl p-4 transition-all cursor-pointer
                  ${notif.read 
                    ? 'border-gray-200 dark:border-white/10' 
                    : 'border-accent/50 bg-accent/5'
                  }
                `}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${notif.read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-accent/20'}
                  `}>
                    <i className={`fas fa-${notif.type === 'application' ? 'file-alt' : 'bell'} ${notif.read ? 'text-gray-600' : 'text-accent'}`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      {notif.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                    {(() => {
                      const href = getNotificationDetailHref(notif, pathname)
                      const hasNoticeId = isNoticeType(notif.type) && (notif.notice_id || notif.link?.match(NOTICE_ID_UUID))
                      const showLink = isNoticeType(notif.type) ? true : !!notif.link
                      const role = pathname.split('/')[2] || 'skilled'
                      const dashboardRole = role === 'student' ? 'graduate' : role
                      const detailHref = (isNoticeType(notif.type) && hasNoticeId && NOTICE_ID_UUID.test(href))
                        ? href
                        : isNoticeType(notif.type)
                          ? `/dashboard/${dashboardRole}/notices/from-notification/${notif.id}`
                          : normalizeNotificationLink(notif.link, pathname)
                      if (!showLink) return null
                      return (
                        <Link href={detailHref || `/dashboard/${dashboardRole}/notifications`} className="text-accent hover:text-accent/80 text-sm font-medium mt-2 inline-block">
                          View Details →
                        </Link>
                      )
                    })()}
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
