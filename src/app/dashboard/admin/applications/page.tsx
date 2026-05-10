'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, UserRole } from '@/types'
import { cn, formatDate, ROLE_LABELS, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import {
  SearchableEntityPicker,
  type SearchablePickerOption,
} from '@/components/dashboard/SearchableEntityPicker'
import {
  ADMIN_APPLICATIONS_SEARCH_MIN_CHARS,
  ADMIN_APPLICATIONS_SEARCH_MAX_IDS,
  resolveApplicationSearchIds,
  sanitizeAdminApplicationsSearch,
  type SearchIdsResult,
} from '@/lib/admin-applications-search'
import {
  exportApplicationsToExcel,
  exportApplicationsToPdf,
  type ApplicationsExportRow,
} from '@/lib/admin-applications-export'
import { useDebouncedValue } from '@/lib/use-debounced-value'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20
const MAX_EXPORT_ROWS = 2500

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
  jobs: {
    title: string
    profiles?:
      | {
          farm_name?: string | null
          full_name?: string | null
        }
      | null
  } | null
  profiles:
    | {
        full_name: string | null
        email: string | null
        role: UserRole | null
        preferred_region: string | null
        city: string | null
      }
    | {
        full_name: string | null
        email: string | null
        role: UserRole | null
        preferred_region: string | null
        city: string | null
      }[]
    | null
}

const SELECT_FIELDS = `
  *,
  jobs (
    title,
    profiles!jobs_farm_id_fkey ( farm_name, full_name )
  ),
  profiles!applications_applicant_id_fkey(full_name, email, role, preferred_region, city)
`

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

function matchPillClass(score: number | null) {
  const s = score ?? 0
  if (s >= 70) return 'bg-green-50 text-green-700'
  if (s >= 50) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

function applySearchAndFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder chain
  q: any,
  statusTab: TabKey,
  filterJobId: string | null,
  filterApplicantId: string | null,
  searchIds: SearchIdsResult
) {
  let query = q

  if (statusTab !== 'all') {
    if (statusTab === 'reviewing') {
      query = query.in('status', ['reviewing', 'reviewed'])
    } else {
      query = query.eq('status', statusTab)
    }
  }

  if (filterJobId) query = query.eq('job_id', filterJobId)
  if (filterApplicantId) query = query.eq('applicant_id', filterApplicantId)

  if (searchIds.kind === 'match') {
    const a = searchIds.applicantIds.slice(0, ADMIN_APPLICATIONS_SEARCH_MAX_IDS)
    const j = searchIds.jobIds.slice(0, ADMIN_APPLICATIONS_SEARCH_MAX_IDS)
    if (a.length && j.length) {
      query = query.or(`applicant_id.in.(${a.join(',')}),job_id.in.(${j.join(',')})`)
    } else if (a.length) {
      query = query.in('applicant_id', a)
    } else if (j.length) {
      query = query.in('job_id', j)
    }
  }

  return query
}

function adminRowToExport(r: AdminRow): ApplicationsExportRow {
  const applicantProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
  const role = applicantProfile?.role
  const roleLabel = role != null ? ROLE_LABELS[role] ?? role : ''
  const jobPoster = r.jobs?.profiles
  const poster =
    jobPoster && !Array.isArray(jobPoster)
      ? jobPoster
      : Array.isArray(jobPoster)
        ? jobPoster[0]
        : null
  const orgLabel =
    poster?.farm_name?.trim() || poster?.full_name?.trim() || ''
  return {
    applicant: applicantProfile?.full_name ?? '',
    email: applicantProfile?.email ?? '',
    role: roleLabel,
    job: r.jobs?.title ?? '',
    organisation: orgLabel,
    matchPercent: String(r.match_score ?? 0),
    status: String(r.status ?? ''),
    applied: formatDate(r.created_at, 'dd MMM yyyy, HH:mm'),
  }
}

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<AdminRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [statusTab, setStatusTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)

  const [filterJobId, setFilterJobId] = useState<string | null>(null)
  const [filterJobLabel, setFilterJobLabel] = useState<string | null>(null)
  const [filterApplicantId, setFilterApplicantId] = useState<string | null>(null)
  const [filterApplicantLabel, setFilterApplicantLabel] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)

  const fetchJobOptions = useCallback(async (rawQuery: string): Promise<SearchablePickerOption[]> => {
    const term = sanitizeAdminApplicationsSearch(rawQuery)
    let q = supabase.from('jobs').select('id, title').limit(40)
    if (term.length >= ADMIN_APPLICATIONS_SEARCH_MIN_CHARS) {
      q = q.ilike('title', `%${term}%`).order('title', { ascending: true })
    } else {
      q = q.order('created_at', { ascending: false })
    }
    const { data, error: err } = await q
    if (err) throw err
    return (data ?? []).map((j: { id: string; title: string | null }) => ({
      id: j.id,
      label: j.title?.trim() ? j.title : 'Untitled job',
    }))
  }, [])

  const fetchApplicantOptions = useCallback(
    async (rawQuery: string): Promise<SearchablePickerOption[]> => {
      const term = sanitizeAdminApplicationsSearch(rawQuery)
      let q = supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['graduate', 'student', 'skilled'])
        .limit(40)
      if (term.length >= ADMIN_APPLICATIONS_SEARCH_MIN_CHARS) {
        const pat = `%${term}%`
        q = q.or(`full_name.ilike.${pat},email.ilike.${pat}`)
      }
      q = q.order('full_name', { ascending: true })
      const { data, error: err } = await q
      if (err) throw err
      return (data ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => {
        const name = p.full_name?.trim() || 'Unnamed'
        const em = p.email?.trim()
        return {
          id: p.id,
          label: em ? `${name} · ${em}` : name,
        }
      })
    },
    []
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterJobId, filterApplicantId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const searchIds = await resolveApplicationSearchIds(supabase, debouncedSearch)
      if (cancelled) return

      if (searchIds.kind === 'failed') {
        setError(searchIds.message)
        setRows([])
        setTotal(0)
        setLoading(false)
        return
      }

      if (searchIds.kind === 'none') {
        setRows([])
        setTotal(0)
        setLoading(false)
        return
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q = supabase.from('applications').select(SELECT_FIELDS, { count: 'exact' }).order('created_at', {
        ascending: false,
      })

      q = applySearchAndFilters(q, statusTab, filterJobId, filterApplicantId, searchIds)

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
  }, [page, statusTab, debouncedSearch, filterJobId, filterApplicantId])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filterSummaryLines = useMemo(() => {
    const lines: string[] = []
    lines.push(`Status tab: ${TABS.find((t) => t.key === statusTab)?.label ?? statusTab}`)
    if (filterJobLabel) lines.push(`Job filter: ${filterJobLabel}`)
    if (filterApplicantLabel) lines.push(`Applicant filter: ${filterApplicantLabel}`)
    if (debouncedSearch.trim().length >= ADMIN_APPLICATIONS_SEARCH_MIN_CHARS) {
      lines.push(`Search text: "${debouncedSearch.trim()}"`)
    }
    return lines
  }, [
    statusTab,
    filterJobLabel,
    filterApplicantLabel,
    debouncedSearch,
  ])

  const filterSummaryShort = useMemo(() => {
    const parts: string[] = []
    if (statusTab !== 'all') parts.push(TABS.find((t) => t.key === statusTab)?.label ?? '')
    if (filterJobLabel) parts.push(`Job: ${filterJobLabel}`)
    if (filterApplicantLabel) parts.push(`User: ${filterApplicantLabel}`)
    if (debouncedSearch.trim().length >= ADMIN_APPLICATIONS_SEARCH_MIN_CHARS) parts.push(`Search: "${debouncedSearch.trim()}"`)
    return parts.filter(Boolean).join(' · ')
  }, [statusTab, filterJobLabel, filterApplicantLabel, debouncedSearch])

  async function gatherExportRows(): Promise<ApplicationsExportRow[]> {
    const searchIds = await resolveApplicationSearchIds(supabase, debouncedSearch)
    if (searchIds.kind === 'failed') {
      throw new Error(searchIds.message)
    }
    if (searchIds.kind === 'none') {
      return []
    }

    const batch = 400
    const collected: AdminRow[] = []
    let offset = 0

    while (collected.length < MAX_EXPORT_ROWS) {
      let q = supabase.from('applications').select(SELECT_FIELDS).order('created_at', { ascending: false })

      q = applySearchAndFilters(q, statusTab, filterJobId, filterApplicantId, searchIds)

      const { data, error: qErr } = await q.range(offset, offset + batch - 1)
      if (qErr) throw new Error(qErr.message)
      const chunk = (data as AdminRow[]) ?? []
      if (chunk.length === 0) break
      collected.push(...chunk)
      offset += batch
      if (chunk.length < batch) break
    }

    return collected.slice(0, MAX_EXPORT_ROWS).map(adminRowToExport)
  }

  async function handleExportExcel() {
    setExporting(true)
    setError('')
    try {
      const exportRows = await gatherExportRows()
      const stamp = formatDate(new Date().toISOString(), 'yyyy-MM-dd-HHmm')
      const metaLines = [...filterSummaryLines, `Row count: ${exportRows.length}`]
      exportApplicationsToExcel(exportRows, `applications-${stamp}`, metaLines)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExporting(true)
    setError('')
    try {
      const exportRows = await gatherExportRows()
      const stamp = formatDate(new Date().toISOString(), 'yyyy-MM-dd-HHmm')
      const metaLines = [...filterSummaryLines, `Row count: ${exportRows.length}`]
      exportApplicationsToPdf(exportRows, metaLines, `applications-${stamp}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  function selectTab(key: TabKey) {
    setStatusTab(key)
    setPage(1)
  }

  const headerSubtitle =
    loading && total === 0
      ? 'Loading…'
      : `${total.toLocaleString()} match${total === 1 ? '' : 'es'}${filterSummaryShort ? ` · ${filterSummaryShort}` : ''}`

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <DashboardPageHeader greeting="Applications" subtitle={headerSubtitle} />

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Input
              label="Search"
              placeholder={`Free text (${ADMIN_APPLICATIONS_SEARCH_MIN_CHARS}+ chars) — applicant, email, job title, organisation`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Runs on the server with capped matches — safe for large job and user tables.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting || loading}
              onClick={() => void handleExportExcel()}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting || loading}
              onClick={() => void handleExportPdf()}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" aria-hidden />
              PDF
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SearchableEntityPicker
            label="Filter by job"
            placeholder="Choose a job…"
            valueId={filterJobId}
            valueLabel={filterJobLabel}
            fetchOptions={fetchJobOptions}
            onClear={() => {
              setFilterJobId(null)
              setFilterJobLabel(null)
            }}
            onSelect={(id, label) => {
              setFilterJobId(id)
              setFilterJobLabel(label)
            }}
            disabled={loading || exporting}
          />
          <SearchableEntityPicker
            label="Filter by applicant"
            placeholder="Search name or email…"
            valueId={filterApplicantId}
            valueLabel={filterApplicantLabel}
            fetchOptions={fetchApplicantOptions}
            onClear={() => {
              setFilterApplicantId(null)
              setFilterApplicantLabel(null)
            }}
            onSelect={(id, label) => {
              setFilterApplicantId(id)
              setFilterApplicantLabel(label)
            }}
            disabled={loading || exporting}
          />
        </div>

        {!loading && (
          <p className="mt-3 text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {rows.length.toLocaleString()}
            </span>{' '}
            on this page ·{' '}
            <span className="font-semibold text-gray-900">
              {total.toLocaleString()}
            </span>{' '}
            total matching filters
            {exporting ? (
              <span className="ml-2 inline-flex items-center gap-1 text-brand">
                <Download className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                Preparing export…
              </span>
            ) : null}
          </p>
        )}

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
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      No applications in this view
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const applicantProfile = Array.isArray(r.profiles)
                      ? r.profiles[0]
                      : r.profiles
                    const applicantName = applicantProfile?.full_name ?? 'Unknown'
                    const role = applicantProfile?.role
                    const roleSubtitle =
                      role != null ? ROLE_LABELS[role] ?? role : ''
                    const jobPoster = r.jobs?.profiles
                    const poster =
                      jobPoster && !Array.isArray(jobPoster)
                        ? jobPoster
                        : Array.isArray(jobPoster)
                          ? jobPoster[0]
                          : null
                    const orgLabel =
                      poster?.farm_name?.trim() ||
                      poster?.full_name?.trim() ||
                      ''
                    const score = r.match_score ?? 0
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <p>{applicantName}</p>
                          {roleSubtitle ? (
                            <p className="text-xs text-gray-400">{roleSubtitle}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <p>{r.jobs?.title ?? '-'}</p>
                          {orgLabel ? (
                            <p className="text-xs text-gray-400">{orgLabel}</p>
                          ) : null}
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
