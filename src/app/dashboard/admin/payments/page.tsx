'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job, Payment, Profile } from '@/types'
import { cn, formatCurrency, formatDate, truncate } from '@/lib/utils'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20

function startOfMonthIso() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

type StatusTab = 'all' | Payment['status']

type PayRow = Payment & {
  placements: {
    id: string
    jobs: Pick<Job, 'title'> | null
  } | null
  profiles: Pick<Profile, 'farm_name'> | null
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PayRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [monthPaidSum, setMonthPaidSum] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingAmountSum, setPendingAmountSum] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let q = supabase
      .from('payments')
      .select(
        `
        *,
        placements (
          id,
          jobs ( title )
        ),
        profiles!payments_farm_id_fkey ( farm_name )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
    if (statusTab !== 'all') {
      q = q.eq('status', statusTab)
    }
    const { data, error: qErr, count } = await q.range(from, to)
    if (qErr) {
      setError(qErr.message)
      setRows([])
      setTotal(0)
    } else {
      setRows((data as PayRow[]) ?? [])
      setTotal(count ?? 0)
    }

    const monthStart = startOfMonthIso()
    const { data: paidRows } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
    const sum =
      (paidRows ?? []).reduce(
        (acc, r: { amount: number }) => acc + (Number(r.amount) || 0),
        0
      ) ?? 0
    setMonthPaidSum(sum)

    const { count: pend } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(pend ?? 0)

    const { data: allPaid } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
    const rev =
      (allPaid ?? []).reduce(
        (acc, r: { amount: number }) => acc + (Number(r.amount) || 0),
        0
      ) ?? 0
    setTotalRevenue(rev)

    const { data: pendingRows } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending')
    const pendSum =
      (pendingRows ?? []).reduce(
        (acc, r: { amount: number }) => acc + (Number(r.amount) || 0),
        0
      ) ?? 0
    setPendingAmountSum(pendSum)

    setLoading(false)
  }, [page, statusTab])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const farm = (r.profiles?.farm_name ?? '').toLowerCase()
      return farm.includes(q)
    })
  }, [rows, search])

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
              Total Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatCurrency(totalRevenue, 'GHS')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-800">
              {pendingCount}{' '}
              <span className="text-base font-semibold">
                ({formatCurrency(pendingAmountSum, 'GHS')})
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              This Month
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(monthPaidSum, 'GHS')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Search by farm
            </label>
            <input
              type="search"
              placeholder="Farm name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
            {(
              ['all', 'pending', 'paid', 'failed', 'refunded'] as StatusTab[]
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPage(1)
                  setStatusTab(key)
                }}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium capitalize',
                  statusTab === key
                    ? 'bg-white font-semibold text-brand shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="-mx-4 overflow-x-auto md:mx-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Farm</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4, 5].map((k) => (
                      <TableRowSkeleton key={k} />
                    ))}
                  </>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <CreditCard className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      No payments.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r) => {
                    const refShow = r.paystack_reference
                      ? truncate(r.paystack_reference, 20)
                      : '-'
                    const dateShow = r.paid_at
                      ? formatDate(r.paid_at)
                      : formatDate(r.created_at)
                    const method = r.payment_method?.trim() || '-'
                    const open = expanded === r.id
                    return (
                      <Fragment key={r.id}>
                        <tr className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800">
                            {r.profiles?.farm_name ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {r.placements?.jobs?.title ?? '-'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {formatCurrency(r.amount, r.currency || 'GHS')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                r.status === 'paid' && 'bg-green-50 text-green-700',
                                r.status === 'pending' &&
                                  'bg-amber-50 text-amber-800',
                                r.status === 'failed' && 'bg-red-50 text-red-700',
                                r.status === 'refunded' &&
                                  'bg-gray-100 text-gray-700'
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{method}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {refShow}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {dateShow}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-sm font-medium text-brand hover:underline"
                              onClick={() =>
                                setExpanded((x) => (x === r.id ? null : r.id))
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-4 py-4 text-sm">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Placement id:{' '}
                                  </span>
                                  <span className="font-mono text-gray-900">
                                    {r.placement_id}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Payment reference:{' '}
                                  </span>
                                  <span className="text-gray-900">
                                    {r.payment_reference ?? '-'}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Paystack reference:{' '}
                                  </span>
                                  <span className="break-all font-mono text-gray-900">
                                    {r.paystack_reference ?? '-'}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Paid at:{' '}
                                  </span>
                                  <span className="text-gray-900">
                                    {r.paid_at
                                      ? formatDate(
                                          r.paid_at,
                                          'dd MMM yyyy, HH:mm'
                                        )
                                      : '-'}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Created at:{' '}
                                  </span>
                                  <span className="text-gray-900">
                                    {formatDate(
                                      r.created_at,
                                      'dd MMM yyyy, HH:mm'
                                    )}
                                  </span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
