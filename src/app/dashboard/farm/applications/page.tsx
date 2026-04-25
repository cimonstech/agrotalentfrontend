'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile } from '@/types'
import { timeAgo, cn } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const BASE = '/dashboard/farm/applications'

type TabKey =
  | 'all'
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

type ApplicantEmbed = Pick<
  Profile,
  | 'full_name'
  | 'preferred_region'
  | 'qualification'
  | 'institution_name'
  | 'specialization'
>

type JobEmbed = Pick<Job, 'id' | 'title' | 'farm_id'>

type ApplicationRow = Application & {
  jobs: JobEmbed | null
  profiles: ApplicantEmbed | null
}

function MatchScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
  const tone =
    pct >= 70 ? 'bg-brand/10 text-brand' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return (
    <div className='w-full max-w-[120px]'>
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', tone)}>{pct}%</span>
      <div className='mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100'>
        <div className='h-1 rounded-full bg-gradient-to-r from-brand to-gold' style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className='animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='h-5 w-1/2 rounded bg-gray-200' />
      <div className='mt-3 h-4 w-3/4 rounded bg-gray-200' />
      <div className='mt-4 h-3 w-full rounded bg-gray-200' />
    </div>
  )
}

export default function FarmApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [sortBy, setSortBy] = useState<'match_score' | 'created_at'>(
    'match_score'
  )
  const [search, setSearch] = useState('')

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
          jobs!inner ( id, title, farm_id ),
          profiles!applications_applicant_id_fkey (
            full_name,
            preferred_region,
            qualification,
            institution_name,
            specialization
          )
        `
        )
        .eq('jobs.farm_id', uid)
        .order(sortBy, { ascending: false })
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
  }, [sortBy])

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
    const tabbed = tab === 'all' ? rows : rows.filter((r) =>
      tab === 'reviewing'
        ? r.status === 'reviewing' || r.status === 'reviewed'
        : r.status === tab
    )
    if (!search.trim()) return tabbed
    const q = search.toLowerCase()
    return tabbed.filter((r) => {
      const name = (r.profiles?.full_name ?? '').toLowerCase()
      const job = (r.jobs?.title ?? '').toLowerCase()
      return name.includes(q) || job.includes(q)
    })
  }, [rows, tab, search])

  return (
    <div className='p-4 md:p-6'>
      <DashboardPageHeader greeting='Applications' subtitle={`${rows.length} total applicants`} />

      {error ? (
        <p className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      ) : null}

      <div className='mb-4 flex flex-wrap gap-3'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search applicant or job'
          className='min-w-48 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand/40 focus:outline-none'
        />
        <div className='inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type='button'
              onClick={() => setTab(key)}
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                tab === key ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'match_score' | 'created_at')}
          className='rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand/40 focus:outline-none'
        >
          <option value='match_score'>Sort by match</option>
          <option value='created_at'>Sort by newest</option>
        </select>
      </div>

      {loading ? (
        <div className='space-y-2'>
          {[0, 1, 2, 3].map((k) => (
            <Card key={k} className='h-20 animate-pulse'>
              <div />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className='mx-auto h-12 w-12' />}
            title='No applications in this view'
            description='When candidates apply, they will appear here.'
          />
        </Card>
      ) : (
        <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
          <div className='grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400'>
            <div className='col-span-3'>Applicant</div>
            <div className='col-span-2'>Job</div>
            <div className='col-span-2'>Match Score</div>
            <div className='col-span-2'>Status</div>
            <div className='col-span-2'>Applied</div>
            <div className='col-span-1'>Actions</div>
          </div>
          {filtered.map((app) => {
            const job = app.jobs
            const p = app.profiles
            const name = p?.full_name ?? 'Applicant'
            const email = (p as Profile | null)?.email ?? '-'
            return (
              <div key={app.id} className='grid grid-cols-12 items-center border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50'>
                <div className='col-span-3 flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand'>
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{name}</p>
                    <p className='text-xs text-gray-400'>{email}</p>
                  </div>
                </div>
                <div className='col-span-2 max-w-[140px] truncate text-sm text-gray-600'>{job?.title ?? 'Job'}</div>
                <div className='col-span-2'>
                  <MatchScoreBar score={app.match_score} />
                </div>
                <div className='col-span-2'>
                  <StatusBadge status={app.status} />
                </div>
                <div className='col-span-2 text-sm text-gray-500'>{timeAgo(app.created_at)}</div>
                <div className='col-span-1'>
                  <Link href={`${BASE}/${app.id}`} className='text-sm font-semibold text-brand transition-colors hover:text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
                    Review
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
