'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Briefcase, GraduationCap, Megaphone, MessageSquare, Sparkles, UserCheck } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { cn, timeAgo } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
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
  type?: string | null
}

function iconForNotification(n: NotificationRow) {
  const raw = `${n.type ?? ''} ${n.title ?? ''} ${n.message ?? ''}`.toLowerCase()
  if (raw.includes('application')) return { icon: Briefcase, tone: 'bg-brand/10 text-brand' }
  if (raw.includes('training')) return { icon: GraduationCap, tone: 'bg-blue-50 text-blue-600' }
  if (raw.includes('placement')) return { icon: UserCheck, tone: 'bg-purple-50 text-purple-600' }
  if (raw.includes('notice')) return { icon: Megaphone, tone: 'bg-gold/10 text-gold' }
  if (raw.includes('message')) return { icon: MessageSquare, tone: 'bg-green-50 text-green-600' }
  return { icon: Sparkles, tone: 'bg-gray-100 text-gray-600' }
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
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false })
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

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])
  const visible = useMemo(() => items.filter((n) => (filter === 'unread' ? !n.read : true)), [items, filter])

  const markAllRead = async () => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    await load()
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  }

  const markOneRead = async (id: string) => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', uid)
    await load()
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  }

  const onRowClick = async (n: NotificationRow) => {
    if (!n.read) await markOneRead(n.id)
    if (!n.link) return
    if (n.link.startsWith('http://') || n.link.startsWith('https://')) {
      window.open(n.link, '_blank', 'noopener,noreferrer')
    } else {
      router.push(n.link)
    }
  }

  return (
    <div className='p-6'>
      <DashboardPageHeader
        greeting='Notifications'
        subtitle={`${unreadCount} unread`}
        actions={
          <button type='button' className='rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700' onClick={() => void markAllRead()}>
            Mark all read
          </button>
        }
      />

      <div className='mb-4 inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
        <button
          type='button'
          onClick={() => setFilter('all')}
          className={cn('rounded-xl px-4 py-2 text-sm font-medium', filter === 'all' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50')}
        >
          All
        </button>
        <button
          type='button'
          onClick={() => setFilter('unread')}
          className={cn('rounded-xl px-4 py-2 text-sm font-medium', filter === 'unread' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50')}
        >
          Unread
        </button>
      </div>

      {unreadCount > 0 ? (
        <div className='mb-4 flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand/8 p-3 backdrop-blur-sm'>
          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15'>
            <Bell className='h-4 w-4 text-brand' />
          </div>
          <div>
            <p className='text-xs font-semibold text-brand'>{unreadCount} unread notifications</p>
            <p className='mt-0.5 text-[10px] text-gray-400'>Tap to mark as read</p>
          </div>
          <button type='button' onClick={() => void markAllRead()} className='ml-auto text-xs font-semibold text-brand hover:underline'>
            Clear all
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className='space-y-2'>
          {[0, 1, 2, 3].map((k) => (
            <Card key={k} className='h-20 animate-pulse'>
              <div />
            </Card>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className='mx-auto h-12 w-12 text-gray-400' />} title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'} />
        </Card>
      ) : (
        <div>
          {visible.map((n) => {
            const { icon: Icon, tone } = iconForNotification(n)
            return (
              <button key={n.id} type='button' className='w-full text-left' onClick={() => void onRowClick(n)}>
                <Card
                  className={cn(
                    'mb-2 border-l-4 p-4 transition-shadow hover:shadow-sm',
                    n.read ? 'border-l-transparent bg-white/60 backdrop-blur-sm' : 'border-l-brand bg-white shadow-sm shadow-brand/5'
                  )}
                >
                <div className='flex items-start gap-3'>
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', tone)}>
                    <Icon className='h-4 w-4' aria-hidden />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className={cn('text-sm text-gray-900', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</p>
                    {n.message ? <p className='mt-0.5 line-clamp-2 text-xs text-gray-500'>{n.message}</p> : null}
                    <p className='mt-1.5 text-[10px] text-gray-400'>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read ? <span className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand' /> : null}
                </div>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
