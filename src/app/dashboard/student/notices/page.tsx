'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { formatDate, timeAgo, truncate, cn } from '@/lib/utils'
import type { Notice } from '@/types'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

const supabase = createSupabaseClient()

const AUDIENCE = 'student'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function StudentNoticesPage() {
  const [rows, setRows] = useState<Notice[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setRows([])
      setLoading(false)
      return
    }
    const { data: notices, error: nErr } = await supabase
      .from('notices')
      .select('*')
      .or(`audience.eq.all,audience.eq.${AUDIENCE}`)
      .order('created_at', { ascending: false })
    if (nErr) {
      setError(nErr.message)
      setLoading(false)
      return
    }
    const list = (notices as Notice[]) ?? []
    setRows(list)
    if (list.length === 0) {
      setReadIds(new Set())
      setLoading(false)
      return
    }
    const ids = list.map((n) => n.id)
    const { data: reads } = await supabase
      .from('notice_reads')
      .select('notice_id')
      .eq('user_id', uid)
      .in('notice_id', ids)
    const rs = new Set(
      (reads ?? []).map((r: { notice_id: string }) => r.notice_id)
    )
    setReadIds(rs)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = filter === 'unread' ? rows.filter((n) => !readIds.has(n.id)) : rows

  return (
    <div className='p-4 md:p-6'>
      <DashboardPageHeader greeting='Notices' subtitle={`${rows.length} notices`} />
        {error ? (
          <p className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </p>
        ) : null}
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

        {loading ? (
          <div className='space-y-4'>
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className='animate-pulse rounded-xl border border-gray-200 bg-white p-6'
              >
                <div className='h-5 w-1/2 rounded bg-gray-200' />
                <div className='mt-3 h-4 w-1/3 rounded bg-gray-200' />
                <div className='mt-4 h-12 w-full rounded bg-gray-200' />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Megaphone className='mx-auto h-12 w-12 text-gray-400' />}
            title='No notices'
            description='Check back later for updates.'
          />
        ) : (
          <ul className='space-y-3'>
            {visible.map((n) => {
              const read = readIds.has(n.id)
              const preview = truncate(stripHtml(n.body_html ?? ''), 150)
              return (
                <li key={n.id}>
                  <Card
                    className={cn(
                      'cursor-pointer p-5 transition-all hover:shadow-md',
                      read ? 'border-l-4 border-l-transparent bg-gray-50/50' : 'border-l-4 border-l-gold shadow-sm'
                    )}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1'>
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', read ? 'bg-gray-100 text-gray-500' : 'bg-gold/15 text-gold')}>
                          <Megaphone className='h-4 w-4' />
                        </div>
                        <h2 className={cn('mt-2 text-sm text-gray-900', read ? 'font-medium' : 'font-semibold')}>{n.title}</h2>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs text-gray-400'>{timeAgo(n.created_at)}</p>
                        <div className='mt-1'>
                          <Pill variant='gray'>{n.audience ?? 'all'}</Pill>
                        </div>
                      </div>
                    </div>
                    <p className='mt-2 line-clamp-2 text-xs text-gray-500'>{preview}</p>
                    <Link
                      href={`/dashboard/student/notices/${n.id}`}
                      className='mt-3 inline-flex text-xs font-semibold text-brand hover:underline'
                    >
                      Read Notice
                    </Link>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}
