'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, UserRole } from '@/types'
import { cn, ROLE_LABELS, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { formatDate, formatCurrency } from '@/lib/utils'
import Image from 'next/image'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20

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

type AdminRow = Application & {
  jobs: { title: string } | null
  profiles: { full_name: string | null; role: UserRole | null } | null
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[0, 1, 2, 3, 4, 5, 6].map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

function matchPillClass(score: number | null) {
  const s = score ?? 0
  if (s >= 70) return 'bg-green-50 text-green-700'
  if (s >= 50) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<AdminRow[]>([])
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
        .from('applications')
        .select(
          `
          *,
          jobs ( title ),
          profiles!applications_applicant_id_fkey ( full_name, role )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
      if (statusTab !== 'all') {
        if (statusTab === 'reviewing') {
          q = q.in('status', ['reviewing', 'reviewed'])
        } else {
          q = q.eq('status', statusTab)
        }
      }
      const { data, error: qErr, count } = await q.range(from, to)
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows([])
        setTotal(0)
      } else {
        setRows((data as AdminRow[]) ?? [])
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
      const name = (r.profiles?.full_name ?? '').toLowerCase()
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
        <DashboardPageHeader greeting='Applications' subtitle={`${total} total`} />

        <div className="mt-4 max-w-md">
          <Input
            label="Search"
            placeholder="Applicant name or job title"
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
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Match Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
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
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      No applications in this view
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r) => {
                    const role = r.profiles?.role
                    const roleLabel =
                      role != null ? ROLE_LABELS[role] ?? role : '-'
                    const score = r.match_score ?? 0
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {r.profiles?.full_name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {r.jobs?.title ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          {role ? (
                            <Pill variant="gray">{roleLabel}</Pill>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              matchPillClass(r.match_score)
                            )}
                          >
                            {score}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {timeAgo(r.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/admin/applications/${r.id}`}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
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
