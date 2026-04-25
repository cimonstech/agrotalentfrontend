'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job } from '@/types'
import { JOB_TYPES, cn, timeAgo } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()
const BASE = '/dashboard/skilled/applications'

type TabKey = 'all' | 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

type JobEmbed = Pick<Job, 'title' | 'location' | 'job_type' | 'farm_id'> & {
  profiles: { farm_name: string | null } | null
}

type ApplicationRow = Application & { jobs: JobEmbed | null }

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function scorePct(v: number) {
  return Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0))
}

export default function GraduateApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        if (!cancelled) {
          setError('You must be signed in')
          setRows([])
          setLoading(false)
        }
        return
      }
      const { data, error: qErr } = await supabase
        .from('applications')
        .select(
          `
          *,
          jobs (
            title,
            location,
            job_type,
            farm_id,
            profiles!jobs_farm_id_fkey ( farm_name )
          )
        `
        )
        .eq('applicant_id', uid)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows([])
      } else {
        setRows((data as ApplicationRow[]) ?? [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: rows.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    }
    for (const r of rows) {
      const key = r.status === 'reviewed' ? 'reviewing' : r.status
      if (key in c) c[key as TabKey] += 1
    }
    return c
  }, [rows])

  const filtered = useMemo(() => {
    if (tab === 'all') return rows
    return rows.filter((r) => (tab === 'reviewing' ? r.status === 'reviewing' || r.status === 'reviewed' : r.status === tab))
  }, [rows, tab])

  const pendingCol = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows])
  const reviewedCol = useMemo(() => rows.filter((r) => r.status === 'reviewing' || r.status === 'shortlisted'), [rows])
  const acceptedCol = useMemo(() => rows.filter((r) => r.status === 'accepted'), [rows])
  const rejectedCol = useMemo(() => rows.filter((r) => r.status === 'rejected'), [rows])

  const subtitle = `${rows.length} total applications`

  return (
    <div className='p-6'>
      <DashboardPageHeader greeting='My Applications' subtitle={subtitle} />

      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex flex-wrap gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          {TABS.map(({ key, label }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type='button'
                onClick={() => setTab(key)}
                className={cn(
                  'cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-brand text-white font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                {label}
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className='flex gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          <button
            type='button'
            onClick={() => setViewMode('list')}
            className={cn(
              'cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              viewMode === 'list' ? 'bg-brand text-white font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            List
          </button>
          <button
            type='button'
            onClick={() => setViewMode('timeline')}
            className={cn(
              'cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              viewMode === 'timeline' ? 'bg-brand text-white font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            Kanban
          </button>
        </div>
      </div>

      {error ? <p className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p> : null}

      {viewMode === 'list' ? (
        loading ? (
          <div className='space-y-3'>
            {[0, 1, 2].map((k) => (
              <Card key={k} className='animate-pulse p-6'>
                <div className='h-5 w-1/3 rounded bg-gray-200' />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<MapPin className='mx-auto h-10 w-10 text-gray-400' />}
              title='No applications in this view'
              description='Try another tab or browse open roles to apply.'
            />
          </Card>
        ) : (
          <div className='space-y-3'>
            {filtered.map((app) => {
              const job = app.jobs
              const farmName = job?.profiles?.farm_name ?? 'Farm'
              const score = scorePct(app.match_score)
              return (
                <Link key={app.id} href={`${BASE}/${app.id}`}>
                  <Card className='cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-md'>
                    <div className='flex items-center gap-4'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand'>
                        {(job?.title ?? 'J').slice(0, 1).toUpperCase()}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <p className='truncate text-base font-semibold text-gray-900'>{job?.title ?? 'Job'}</p>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className='mt-1 flex items-center gap-1 text-sm text-gray-500'>
                          <MapPin className='h-3.5 w-3.5' aria-hidden />
                          {farmName} · {job?.location ?? '-'}
                        </p>
                        <div className='mt-2 flex items-center gap-3'>
                          <div className='h-1.5 flex-1 rounded-full bg-gray-100'>
                            <div
                              className='h-1.5 rounded-full'
                              style={{ width: `${score}%`, backgroundImage: 'linear-gradient(90deg,#1A6B3C,#C8963E)' }}
                            />
                          </div>
                          <span className='text-xs text-gray-400'>Match: {score}%</span>
                        </div>
                        <p className='mt-1 text-xs text-gray-400'>Applied {timeAgo(app.created_at)}</p>
                      </div>
                      <ChevronRight className='h-4 w-4 text-gray-300' aria-hidden />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )
      ) : loading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className='h-64 animate-pulse rounded-2xl bg-gray-200' />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          {[
            { title: 'Pending', tone: 'bg-amber-50 text-amber-700', rows: pendingCol },
            { title: 'Reviewed/Shortlisted', tone: 'bg-blue-50 text-blue-700', rows: reviewedCol },
            { title: 'Accepted', tone: 'bg-brand/10 text-brand', rows: acceptedCol },
            { title: 'Rejected', tone: 'bg-red-50 text-red-600', rows: rejectedCol },
          ].map((col) => (
            <div key={col.title}>
              <div className={`mb-3 rounded-2xl p-3 text-center ${col.tone}`}>
                <p className='text-sm font-semibold'>{col.title}</p>
                <p className='mt-1 text-xs font-bold'>{col.rows.length}</p>
              </div>
              {col.rows.map((app) => {
                const job = app.jobs
                const score = scorePct(app.match_score)
                return (
                  <Link key={app.id} href={`${BASE}/${app.id}`}>
                    <div className='mb-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
                      <p className='truncate text-sm font-semibold text-gray-900'>{job?.title ?? 'Job'}</p>
                      <p className='mt-0.5 truncate text-xs text-gray-400'>{job?.profiles?.farm_name ?? 'Farm'}</p>
                      <p className='mt-1 text-[11px] text-gray-500'>{job?.job_type ? jobTypeLabel(job.job_type) : '-'}</p>
                      <div className='mt-2 h-1 w-full rounded-full bg-gray-100'>
                        <div
                          className='h-1 rounded-full'
                          style={{ width: `${score}%`, backgroundImage: 'linear-gradient(90deg,#1A6B3C,#C8963E)' }}
                        />
                      </div>
                      <p className='mt-1.5 text-[10px] text-gray-400'>{timeAgo(app.created_at)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
