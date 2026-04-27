'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

const supabase = createSupabaseClient()

type DashboardPageHeaderProps = {
  greeting: string
  subtitle: string
  actions?: ReactNode
}

function nameFromGreeting(greeting: string): string {
  const idx = greeting.indexOf(',')
  if (idx >= 0) return greeting.slice(idx + 1).trim()
  return greeting.trim()
}

export default function DashboardPageHeader({
  greeting,
  subtitle,
  actions,
}: DashboardPageHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const initials = useMemo(() => getInitials(nameFromGreeting(greeting)), [greeting])

  useEffect(() => {
    let cancelled = false

    const loadUnread = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        if (!cancelled) setUnreadCount(0)
        return
      }
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false)
      if (!cancelled) setUnreadCount(count ?? 0)
    }

    void loadUnread()
    const handleRefresh = () => {
      void loadUnread()
    }
    window.addEventListener('notifications-updated', handleRefresh)
    return () => {
      cancelled = true
      window.removeEventListener('notifications-updated', handleRefresh)
    }
  }, [])

  return (
    <div className='mb-6 flex items-center justify-between'>
      <div>
        <h2 className='text-xl font-bold text-gray-900'>{greeting}</h2>
        <p className='mt-1 text-xs text-gray-400'>{subtitle}</p>
      </div>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2 rounded-2xl border border-gray-100 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm'>
          <button
            type='button'
            className='relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white transition-colors hover:border-brand/30'
            aria-label='Notifications'
          >
            <Bell className='h-4 w-4 text-gray-500' aria-hidden />
            {unreadCount > 0 ? <span className='absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold' /> : null}
          </button>
          <span className='h-5 w-px bg-gray-200' />
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-xs font-bold text-white'>
            {initials}
          </div>
        </div>
        {actions}
      </div>
    </div>
  )
}
