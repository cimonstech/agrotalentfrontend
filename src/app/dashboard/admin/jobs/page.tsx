'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Clock3, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'
import { cn, GHANA_REGIONS, JOB_TYPES, timeAgo } from '@/lib/utils'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { formatDate, formatCurrency, ROLE_LABELS } from '@/lib/utils'
import Image from 'next/image'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles?: {
    farm_name?: string | null
    full_name?: string | null
    farm_type?: string | null
  } | null
}

function jobTypeLabel(v: string | undefined) {
  if (!v) return '-'
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

export default function AdminJobsPage() {
  const PAGE_SIZE = 10
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<
    'all' | 'active' | 'closed' | 'draft' | 'deleted'
  >('all')
  const [region, setRegion] = useState('')
  const [closingId, setClosingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  async function fetchJobs(currentTab: 'all' | 'active' | 'closed' | 'draft' | 'deleted') {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*, profiles!jobs_farm_id_fkey(farm_name, full_name, farm_type)')
    if (currentTab === 'deleted') {
      query = query
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
    } else {
      query = query
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (currentTab !== 'all') {
        query = query.eq('status', currentTab)
      }
    }
    const { data, error } = await query
    if (!error && data) {
      setJobs(data as JobRow[])
    } else {
      setJobs([])
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await fetchJobs(statusTab)
      if (cancelled) {
        return
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusTab])

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (statusTab !== 'deleted' && statusTab !== 'all' && job.status !== statusTab) return false
      if (region && (job.location ?? '') !== region) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      const title = (job.title ?? '').toLowerCase()
      const farm = (job.profiles?.farm_name ?? '').toLowerCase()
      return title.includes(q) || farm.includes(q)
    })
  }, [jobs, statusTab, region, search])

  useEffect(() => {
    setPage(1)
  }, [search, statusTab, region])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  async function closeJob(jobId: string) {
    setClosingId(jobId)
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('id', jobId)
    if (!error) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'closed' } : j))
      )
    } else {
      console.error('Close job error:', error)
    }
    setClosingId(null)
  }

  async function restoreJob(jobId: string) {
    const { error } = await supabase
      .from('jobs')
      .update({
        deleted_at: null,
        hidden_at: null,
        status: 'active',
        reactivated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    if (!error) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
    }
  }

  async function permanentlyDeleteJob(jobId: string) {
    if (!window.confirm('Permanently delete this job? This cannot be undone.')) {
      return
    }
    const { error } = await supabase.from('jobs').delete().eq('id', jobId)
    if (!error) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
    }
  }

  async function runExpiryCheck() {
    const res = await fetch('/api/jobs/hide-expired', { method: 'POST' })
    const data = await res.json()
    alert('Done. Hidden: ' + (data.hidden ?? 0) + ', Deleted: ' + (data.deleted ?? 0))
    window.location.reload()
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <DashboardPageHeader
          greeting='Job Management'
          subtitle={`${jobs.length} total jobs`}
          actions={
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => void runExpiryCheck()}
                className='inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50'
              >
                <Clock3 className='h-4 w-4' />
                Run Expiry Check
              </button>
              <Link
                href='/dashboard/admin/jobs/new'
                className='inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-95'
              >
                Add Job
              </Link>
            </div>
          }
        />

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            placeholder="Search title or farm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-48 flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
            {(
              ['all', 'active', 'closed', 'draft', 'deleted'] as const
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusTab(key)}
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
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">All regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Farm</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Applications</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Posted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4, 5].map((k) => (
                      <tr key={k} className="animate-pulse border-b border-gray-50">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                          <td key={c} className="px-4 py-3">
                            <div className="h-4 rounded bg-gray-100" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      <Briefcase className="mx-auto mb-2 h-10 w-10 opacity-40" />
                      No jobs match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {job.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {job.is_platform_job
                          ? 'AgroTalent Hub'
                          : job.profiles?.farm_name ??
                            job.profiles?.full_name ??
                            'Unknown Farm'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {job.location ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Pill variant="gray">
                          {jobTypeLabel(job.job_type)}
                        </Pill>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                          {job.application_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {statusTab === 'deleted' ? (
                          <StatusBadge status='rejected' />
                        ) : (
                          <StatusBadge status={job.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {job.created_at ? timeAgo(job.created_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            View
                          </Link>
                          <Link
                            href={'/dashboard/admin/jobs/' + job.id + '/edit'}
                            className='text-sm font-semibold text-brand hover:underline'
                          >
                            Edit
                          </Link>
                          {statusTab === 'deleted' ? (
                            <>
                              <button
                                type='button'
                                onClick={() => void restoreJob(job.id)}
                                className='rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700'
                              >
                                Restore
                              </button>
                              <button
                                type='button'
                                onClick={() => void permanentlyDeleteJob(job.id)}
                                className='rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600'
                              >
                                Permanently Delete
                              </button>
                            </>
                          ) : job.status !== 'closed' ? (
                            <button
                              type="button"
                              disabled={closingId === job.id}
                              onClick={() => void closeJob(job.id)}
                              className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                            >
                              {closingId === job.id ? '...' : 'Close'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {!loading && filtered.length > 0 ? (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-gray-500'>
              Page {page} of {totalPages}
            </p>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Previous
              </button>
              <button
                type='button'
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
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
