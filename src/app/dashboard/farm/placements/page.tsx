'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Check, Minus, Briefcase } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job, Payment, Placement, Profile } from '@/types'
import { formatCurrency, formatDate, JOB_TYPES, cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const supabase = createSupabaseClient()

const DETAIL_BASE = '/dashboard/farm/placements'

type TabKey = 'all' | Placement['status']

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'terminated', label: 'Terminated' },
]

type JobEmbed = Pick<Job, 'title' | 'location' | 'job_type'>
type GradEmbed = Pick<
  Profile,
  'full_name' | 'qualification' | 'preferred_region'
>
type PayEmbed = Pick<Payment, 'status' | 'amount' | 'paid_at'>

type PlacementRow = Placement & {
  jobs: JobEmbed | null
  profiles: GradEmbed | null
  payments: PayEmbed | PayEmbed[] | null
}

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function firstPayment(
  p: PayEmbed | PayEmbed[] | null | undefined
): PayEmbed | null {
  if (p == null) return null
  return Array.isArray(p) ? (p[0] ?? null) : p
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-1/2 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
    </div>
  )
}

export default function FarmPlacementsPage() {
  const [rows, setRows] = useState<PlacementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('all')

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
        .from('placements')
        .select(
          `
          *,
          jobs ( title, location, job_type ),
          profiles!placements_graduate_id_fkey ( full_name, qualification, preferred_region ),
          payments ( status, amount, paid_at )
        `
        )
        .eq('farm_id', uid)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows([])
      } else {
        setRows((data as PlacementRow[]) ?? [])
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
      active: 0,
      completed: 0,
      terminated: 0,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Placements</h1>
          <p className="mt-1 text-gray-600">
            Graduates placed in your roles
          </p>
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
              icon={<Briefcase className="mx-auto h-12 w-12" />}
              title="No placements yet"
              description="Placements you create will appear here."
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((p) => {
              const job = p.jobs
              const grad = p.profiles
              const pay = firstPayment(p.payments)
              const amt =
                pay?.amount != null
                  ? pay.amount
                  : p.recruitment_fee_amount
              const currency = 'GHS'
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <p className="font-semibold text-gray-900">
                    {grad?.full_name ?? 'Graduate'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {[grad?.qualification, grad?.preferred_region]
                      .filter(Boolean)
                      .join(' · ') || 'Profile details'}
                  </p>
                  <h2 className="mt-3 text-base font-semibold text-gray-900">
                    {job?.title ?? 'Role'}
                  </h2>
                  {job?.location ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
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
                  <div className="mt-3">
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      Training completed:{' '}
                      {p.training_completed ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Yes"
                        />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-400" aria-label="No" />
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Zoom attended:{' '}
                      {p.zoom_session_attended ? (
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-label="Yes"
                        />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-400" aria-label="No" />
                      )}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-800">
                    Fee:{' '}
                    <span className="font-medium">
                      {formatCurrency(amt, currency)}
                    </span>
                    {' · '}
                    {p.recruitment_fee_paid ? (
                      <span className="text-green-700">Paid</span>
                    ) : (
                      <span className="text-yellow-700">Unpaid</span>
                    )}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-600">Start</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDate(p.start_date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">End</dt>
                      <dd className="font-medium text-gray-900">
                        {p.end_date ? formatDate(p.end_date) : '-'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <Link href={`${DETAIL_BASE}/${p.id}`}>
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
      </div>
    </div>
  )
}
