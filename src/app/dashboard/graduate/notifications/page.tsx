'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { timeAgo, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

const supabase = createSupabaseClient()

type NotificationRow = {
  id: string
  user_id: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

function RowSkeleton() {
  return (
    <div className="animate-pulse border-b border-gray-100 px-4 py-4">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-full rounded bg-gray-200" />
      <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
    </div>
  )
}

export default function GraduateNotificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setItems([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) {
      setItems([])
      setLoading(false)
      return
    }
    setItems((data as NotificationRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = items.filter((n) =>
    filter === 'unread' ? !n.read : true
  )

  const markAllRead = async () => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', uid)
      .eq('read', false)
    await load()
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  }

  const markOneRead = async (id: string) => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', uid)
    await load()
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  }

  const onRowClick = async (n: NotificationRow) => {
    if (!n.read) {
      await markOneRead(n.id)
    }
    if (n.link) {
      if (n.link.startsWith('http://') || n.link.startsWith('https://')) {
        window.open(n.link, '_blank', 'noopener,noreferrer')
      } else {
        router.push(n.link)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void markAllRead()}
          >
            Mark all as read
          </Button>
        </div>

        <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              filter === 'all'
                ? 'bg-green-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              filter === 'unread'
                ? 'bg-green-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Unread
          </button>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {[0, 1, 2, 3, 4].map((k) => (
              <RowSkeleton key={k} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          filter === 'unread' ? (
            <EmptyState
              icon={<Bell className="mx-auto h-12 w-12 text-gray-400" />}
              title="No unread notifications"
            />
          ) : (
            <EmptyState
              icon={<Bell className="mx-auto h-12 w-12 text-gray-400" />}
              title="No notifications yet"
            />
          )
        ) : (
          <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void onRowClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-gray-100 px-4 py-4 text-left last:border-b-0',
                    !n.read
                      ? 'border-l-4 border-l-green-600 bg-white'
                      : 'bg-gray-50',
                    n.link ? 'cursor-pointer' : ''
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm text-gray-900',
                        !n.read ? 'font-medium' : 'font-normal'
                      )}
                    >
                      {n.title}
                    </p>
                    {n.message ? (
                      <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(n.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
