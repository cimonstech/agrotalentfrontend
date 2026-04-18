'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile } from '@/types'
import { timeAgo, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const BASE = '/dashboard/farm/applications'

type TabKey = 'all' | Application['status']

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
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
  const bar =
    pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full max-w-xs">
      <div className="mb-1 text-xs text-gray-600">Match: {pct}%</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-1/2 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="mt-1 text-gray-600">
              Review people who applied to your roles
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={sortBy === 'match_score' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('match_score')}
            >
              By match score
            </Button>
            <Button
              type="button"
              variant={sortBy === 'created_at' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('created_at')}
            >
              By date applied
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

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
              description="When candidates apply, they will appear here."
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((app) => {
              const job = app.jobs
              const p = app.profiles
              const name = p?.full_name ?? 'Applicant'
              return (
                <li
                  key={app.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {[p?.qualification, p?.institution_name]
                      .filter(Boolean)
                      .join(' · ') || 'Profile details pending'}
                  </p>
                  {p?.preferred_region ? (
                    <p className="mt-1 text-sm text-gray-700">
                      Preferred region: {p.preferred_region}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm font-medium text-gray-800">
                    Role: {job?.title ?? 'Job'}
                  </p>
                  <div className="mt-3">
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
                        Review
                      </Button>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
