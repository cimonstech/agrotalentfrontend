'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Handshake, XCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job, Placement, Profile } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20

type TabKey = 'all' | Placement['status']

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'terminated', label: 'Terminated' },
]

type PlacementRow = Placement & {
  jobs: Pick<Job, 'title'> | null
  graduate: Pick<Profile, 'full_name'> | null
  farm: Pick<Profile, 'farm_name'> | null
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminPlacementsPage() {
  const [rows, setRows] = useState<PlacementRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [statusTab, setStatusTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let q = supabase
        .from('placements')
        .select(
          `
          *,
          jobs ( title ),
          graduate:profiles!placements_graduate_id_fkey ( full_name ),
          farm:profiles!placements_farm_id_fkey ( farm_name )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
      if (statusTab !== 'all') {
        q = q.eq('status', statusTab)
      }
      const { data, error: qErr, count } = await q.range(from, to)
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows([])
        setTotal(0)
      } else {
        setRows((data as PlacementRow[]) ?? [])
        setTotal(count ?? 0)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [page, statusTab])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const name = (r.graduate?.full_name ?? '').toLowerCase()
      const title = (r.jobs?.title ?? '').toLowerCase()
      return name.includes(q) || title.includes(q)
    })
  }, [rows, search])

  function selectTab(key: TabKey) {
    setStatusTab(key)
    setPage(1)
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Placements</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>

        <div className="mt-4 max-w-md">
          <Input
            label="Search"
            placeholder="Graduate name or job title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectTab(key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium',
                statusTab === key
                  ? 'bg-white font-semibold text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="-mx-4 overflow-x-auto md:mx-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Graduate</th>
                  <th className="px-4 py-3">Farm</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Training</th>
                  <th className="px-4 py-3">Fee Paid</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4].map((k) => (
                      <TableRowSkeleton key={k} />
                    ))}
                  </>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <Handshake className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      No placements in this view
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {r.graduate?.full_name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.farm?.farm_name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.jobs?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.training_completed ? (
                          <CheckCircle
                            className="h-5 w-5 text-green-500"
                            aria-label="Training complete"
                          />
                        ) : (
                          <XCircle
                            className="h-5 w-5 text-gray-300"
                            aria-label="Training incomplete"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.recruitment_fee_paid ? (
                          <CheckCircle
                            className="h-5 w-5 text-green-500"
                            aria-label="Fee paid"
                          />
                        ) : (
                          <XCircle
                            className="h-5 w-5 text-gray-300"
                            aria-label="Fee not paid"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(r.start_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/placements/${r.id}`}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
