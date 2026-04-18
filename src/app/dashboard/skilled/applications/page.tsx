'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job } from '@/types'
import { JOB_TYPES, timeAgo, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const BASE = '/dashboard/skilled/applications'

type TabKey = 'all' | Application['status']

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

type JobEmbed = Pick<Job, 'title' | 'location' | 'job_type' | 'farm_id'> & {
  profiles: { farm_name: string | null } | null
}

type ApplicationRow = Application & {
  jobs: JobEmbed | null
}

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function MatchScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
  const bar =
    pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span>Match: {pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function KanbanScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
  const fill =
    pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
      <div
        className={cn('h-1.5 rounded-full', fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
      <div className="mt-2 h-3 w-4/5 rounded bg-gray-200" />
    </div>
  )
}

export default function SkilledApplicationsPage() {
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
      reviewed: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    }
    for (const r of rows) {
      c[r.status] += 1
    }
    return c
  }, [rows])

  const filtered = useMemo(() => {
    if (tab === 'all') return rows
    return rows.filter((r) => r.status === tab)
  }, [rows, tab])

  const pendingCol = useMemo(
    () => rows.filter((r) => r.status === 'pending'),
    [rows]
  )
  const reviewedCol = useMemo(
    () =>
      rows.filter(
        (r) => r.status === 'reviewed' || r.status === 'shortlisted'
      ),
    [rows]
  )
  const acceptedCol = useMemo(
    () => rows.filter((r) => r.status === 'accepted'),
    [rows]
  )
  const rejectedCol = useMemo(
    () => rows.filter((r) => r.status === 'rejected'),
    [rows]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My applications</h1>
            <p className="mt-1 text-gray-600">
              Track the status of your job applications
            </p>
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white font-semibold text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'timeline'
                  ? 'bg-white font-semibold text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Timeline View
            </button>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {viewMode === 'list' ? (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    tab === key
                      ? 'border-green-700 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {label}
                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-800">
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((k) => (
                  <CardSkeleton key={k} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white">
                <EmptyState
                  icon={<ClipboardList className="mx-auto h-12 w-12" />}
                  title="No applications in this view"
                  description="Try another tab or browse open roles to apply."
                />
              </div>
            ) : (
              <ul className="space-y-4">
                {filtered.map((app) => {
                  const job = app.jobs
                  const farmName = job?.profiles?.farm_name ?? 'Farm'
                  return (
                    <li
                      key={app.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <h2 className="font-semibold text-gray-900">
                        {job?.title ?? 'Job'}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">{farmName}</p>
                      {job?.location ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-green-700"
                            aria-hidden
                          />
                          {job.location}
                        </p>
                      ) : null}
                      {job?.job_type ? (
                        <div className="mt-2">
                          <Pill variant="gray">{jobTypeLabel(job.job_type)}</Pill>
                        </div>
                      ) : null}
                      <div className="mt-3 max-w-xs">
                        <MatchScoreBar score={app.match_score} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-gray-500">
                          Applied {timeAgo(app.created_at)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <Link href={`${BASE}/${app.id}`}>
                          <Button type="button" variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-64 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={<ClipboardList className="mx-auto h-12 w-12" />}
              title="No applications in this view"
              description="Try another tab or browse open roles to apply."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                <span>Pending</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {pendingCol.length}
                </span>
              </div>
              <div className="mt-2">
                {pendingCol.map((app) => {
                  const job = app.jobs
                  const farmName = job?.profiles?.farm_name ?? 'Farm'
                  return (
                    <div
                      key={app.id}
                      className="mb-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {job?.title ?? 'Job'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{farmName}</p>
                      <KanbanScoreBar score={app.match_score} />
                      <p className="mt-2 text-xs text-gray-400">
                        Applied {timeAgo(app.created_at)}
                      </p>
                      <Link
                        href={`${BASE}/${app.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                <span>Reviewed / Shortlisted</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                  {reviewedCol.length}
                </span>
              </div>
              <div className="mt-2">
                {reviewedCol.map((app) => {
                  const job = app.jobs
                  const farmName = job?.profiles?.farm_name ?? 'Farm'
                  return (
                    <div
                      key={app.id}
                      className="mb-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {job?.title ?? 'Job'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{farmName}</p>
                      <KanbanScoreBar score={app.match_score} />
                      <p className="mt-2 text-xs text-gray-400">
                        Applied {timeAgo(app.created_at)}
                      </p>
                      <Link
                        href={`${BASE}/${app.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                <span>Accepted</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  {acceptedCol.length}
                </span>
              </div>
              <div className="mt-2">
                {acceptedCol.map((app) => {
                  const job = app.jobs
                  const farmName = job?.profiles?.farm_name ?? 'Farm'
                  return (
                    <div
                      key={app.id}
                      className="mb-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {job?.title ?? 'Job'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{farmName}</p>
                      <KanbanScoreBar score={app.match_score} />
                      <p className="mt-2 text-xs text-gray-400">
                        Applied {timeAgo(app.created_at)}
                      </p>
                      <Link
                        href={`${BASE}/${app.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                <span>Rejected</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {rejectedCol.length}
                </span>
              </div>
              <div className="mt-2">
                {rejectedCol.map((app) => {
                  const job = app.jobs
                  const farmName = job?.profiles?.farm_name ?? 'Farm'
                  return (
                    <div
                      key={app.id}
                      className="mb-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {job?.title ?? 'Job'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">{farmName}</p>
                      <KanbanScoreBar score={app.match_score} />
                      <p className="mt-2 text-xs text-gray-400">
                        Applied {timeAgo(app.created_at)}
                      </p>
                      <Link
                        href={`${BASE}/${app.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
