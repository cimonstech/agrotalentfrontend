'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Users } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types'
import { cn, formatDate, getInitials, ROLE_LABELS } from '@/lib/utils'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20

type RoleTab = 'all' | 'farm' | 'graduate' | 'student' | 'skilled'
type VerifyTab = 'all' | 'verified' | 'unverified'

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[0, 1, 2, 3, 4, 5].map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

function displayName(p: Profile): string {
  if (p.role === 'farm' && p.farm_name?.trim()) return p.farm_name
  return p.full_name?.trim() || '-'
}

function initialsForRow(p: Profile): string {
  if (p.role === 'farm' && p.farm_name?.trim()) {
    return getInitials(p.farm_name)
  }
  return getInitials(p.full_name ?? p.email)
}

function regionOrLocation(p: Profile): string {
  if (p.role === 'farm') return p.farm_location?.trim() || '-'
  return p.preferred_region?.trim() || '-'
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [roleTab, setRoleTab] = useState<RoleTab>('all')
  const [verifyTab, setVerifyTab] = useState<VerifyTab>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let q = supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
    if (roleTab !== 'all') {
      q = q.eq('role', roleTab)
    }
    if (verifyTab === 'verified') {
      q = q.eq('is_verified', true)
    } else if (verifyTab === 'unverified') {
      q = q.or('is_verified.eq.false,is_verified.is.null')
    }
    const { data, error: qErr } = await q
    if (qErr) {
      setError(qErr.message)
      setRows([])
    } else {
      setRows((data as Profile[]) ?? [])
    }
    setLoading(false)
  }, [roleTab, verifyTab])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [roleTab, verifyTab, search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((p) => {
      const name = (p.full_name ?? '').toLowerCase()
      const farm = (p.farm_name ?? '').toLowerCase()
      const email = (p.email ?? '').toLowerCase()
      return name.includes(q) || farm.includes(q) || email.includes(q)
    })
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSlice = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE
    return filtered.slice(from, from + PAGE_SIZE)
  }, [filtered, page])

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" aria-hidden />
              {rows.length} registered users
            </p>
          </div>
          <Link
            href="/dashboard/admin/users/create"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          >
            Add User
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <input
            type="search"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-48 flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
            {(
              ['all', 'farm', 'graduate', 'student', 'skilled'] as RoleTab[]
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRoleTab(key)}
                className={cn(
                  'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium',
                  roleTab === key
                    ? 'bg-white font-semibold text-brand shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {key === 'all' ? 'All' : ROLE_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
            {(
              [
                ['all', 'All'],
                ['verified', 'Verified'],
                ['unverified', 'Unverified'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVerifyTab(key)}
                className={cn(
                  'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium',
                  verifyTab === key
                    ? 'bg-white font-semibold text-brand shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label}
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
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                      <TableRowSkeleton key={k} />
                    ))}
                  </>
                ) : pageSlice.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      <Users className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                      No users match your filters.
                    </td>
                  </tr>
                ) : (
                  pageSlice.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {initialsForRow(p)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800">
                              {displayName(p)}
                            </p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Pill variant="gray">
                          {ROLE_LABELS[p.role as UserRole] ?? p.role}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {regionOrLocation(p)}
                      </td>
                      <td className="px-4 py-3">
                        {p.is_verified ? (
                          <CheckCircle
                            className="h-4 w-4 text-green-600"
                            aria-label="Verified"
                          />
                        ) : (
                          <XCircle
                            className="h-4 w-4 text-gray-300"
                            aria-label="Not verified"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(p.created_at ?? undefined)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/users/${p.id}`}
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

        {!loading && filtered.length > 0 ? (
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
