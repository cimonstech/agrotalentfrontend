'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job, Payment, Placement, Profile } from '@/types'
import { formatCurrency, formatDate, JOB_TYPES, cn } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
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
    <div className='animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='h-5 w-1/2 rounded bg-gray-200' />
      <div className='mt-3 h-4 w-2/3 rounded bg-gray-200' />
      <div className='mt-4 h-3 w-full rounded bg-gray-200' />
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
    <div className='p-4 md:p-6'>
      <DashboardPageHeader greeting='Placements' subtitle={`${rows.length} total placements`} />

        {error ? (
          <p className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </p>
        ) : null}

        <div className='mb-4 inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type='button'
              onClick={() => setTab(key)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                tab === key
                  ? 'bg-brand text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {label} <span className='ml-1.5 text-[10px]'>{counts[key]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className='space-y-4'>
            {[0, 1, 2, 3].map((k) => (
              <CardSkeleton key={k} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CheckCircle className='mx-auto h-12 w-12' />}
              title='No placements yet'
              description='Placements you create will appear here.'
            />
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
                <Card key={p.id} className='p-5 transition-shadow hover:shadow-md'>
                  <div className='mb-4 flex items-center justify-between'>
                    <p className='font-bold text-gray-900'>{grad?.full_name ?? 'Graduate'}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <p className='text-xs text-gray-400'>Position</p>
                      <p className='text-sm font-medium text-gray-900'>{job?.title ?? 'Role'}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-400'>Start date</p>
                      <p className='text-sm font-medium text-gray-900'>{formatDate(p.start_date)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-400'>Training</p>
                      <p className='mt-1 inline-flex items-center gap-1 text-sm font-medium text-gray-900'>
                      {p.training_completed ? (
                        <CheckCircle className='h-4 w-4 text-green-600' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-500' />
                      )}
                        {p.training_completed ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-400'>Fee</p>
                      <p className='mt-1 inline-flex items-center gap-1 text-sm font-medium text-gray-900'>
                        {p.recruitment_fee_paid ? (
                          <CheckCircle className='h-4 w-4 text-green-600' />
                        ) : (
                          <XCircle className='h-4 w-4 text-red-500' />
                        )}
                        {formatCurrency(amt, currency)}
                      </p>
                    </div>
                  </div>

                  {p.status === 'active' && p.start_date && p.end_date ? (
                    <div className='mt-4'>
                      <div className='h-1.5 w-full rounded-full bg-gray-100'>
                        <div
                          className='h-1.5 rounded-full bg-gradient-to-r from-brand to-gold'
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((Date.now() - new Date(p.start_date).getTime()) /
                                  (new Date(p.end_date).getTime() - new Date(p.start_date).getTime() || 1)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className='mt-4 flex items-center justify-between'>
                    <Link href={`${DETAIL_BASE}/${p.id}`} className='text-sm font-semibold text-brand transition-colors hover:text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
                      View Details
                    </Link>
                    {!p.recruitment_fee_paid ? (
                      <Button type='button' variant='outline' size='sm'>
                        Payment
                      </Button>
                    ) : null}
                  </div>

                  <p className='mt-2 text-xs text-gray-400'>
                    {job?.job_type ? jobTypeLabel(job.job_type) : '-'}
                    {job?.location ? ` · ${job.location}` : ''}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {p.end_date ? `End ${formatDate(p.end_date)}` : 'No end date'}
                  </p>
                  {pay?.status ? (
                    <p className='text-xs text-gray-400'>
                      Payment status: {pay.status}
                    </p>
                  ) : null}
                  {pay?.paid_at ? (
                    <p className='text-xs text-gray-400'>
                      Paid on {formatDate(pay.paid_at)}
                    </p>
                  ) : null}
                  {grad?.qualification || grad?.preferred_region ? (
                    <p className='text-xs text-gray-400'>
                      {[grad?.qualification, grad?.preferred_region].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                  {p.zoom_session_attended ? (
                    <p className='text-xs text-gray-400'>Zoom attended</p>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
    </div>
  )
}
