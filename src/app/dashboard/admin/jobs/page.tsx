'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'
import { cn, GHANA_REGIONS, JOB_TYPES, timeAgo } from '@/lib/utils'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles?: { farm_name?: string | null; farm_type?: string | null } | null
}

function jobTypeLabel(v: string | undefined) {
  if (!v) return '-'
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<
    'all' | 'active' | 'closed' | 'draft'
  >('all')
  const [region, setRegion] = useState('')
  const [closingId, setClosingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles!jobs_farm_id_fkey(farm_name, farm_type)')
        .order('created_at', { ascending: false })
      if (!cancelled) {
        if (!error && data) {
          setJobs(data as JobRow[])
        } else {
          setJobs([])
        }
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (statusTab !== 'all' && job.status !== statusTab) return false
      if (region && (job.location ?? '') !== region) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      const title = (job.title ?? '').toLowerCase()
      const farm = (job.profiles?.farm_name ?? '').toLowerCase()
      return title.includes(q) || farm.includes(q)
    })
  }, [jobs, statusTab, region, search])

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

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <Link
            href="/dashboard/farm/jobs/new"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Post New Job
          </Link>
        </div>

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
              ['all', 'active', 'closed', 'draft'] as const
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
                  filtered.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {job.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {job.profiles?.farm_name ?? 'N/A'}
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
                        <StatusBadge status={job.status} />
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
                          {job.status !== 'closed' ? (
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
      </div>
    </div>
  )
}
