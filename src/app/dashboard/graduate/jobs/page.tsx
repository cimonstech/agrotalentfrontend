'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Briefcase, MapPin, Menu, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job } from '@/types'
import {
  formatDate,
  formatSalaryRange,
  GHANA_REGIONS,
  JOB_TYPES,
  timeAgo,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles: { farm_name: string | null } | null
}

type DashboardJobsMode = 'all' | 'exclude_intern_nss' | 'intern_nss_only'

const REGION_OPTIONS = [
  { value: '', label: 'All Regions' },
  ...GHANA_REGIONS.map((r) => ({ value: r, label: r })),
]

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...JOB_TYPES.map((j) => ({ value: j.value, label: j.label })),
]

const SALARY_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '0-1000', label: 'GHS 0-1000' },
  { value: '1000-2000', label: 'GHS 1000-2000' },
  { value: '2000+', label: 'GHS 2000+' },
]

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function matchesSalaryMin(
  salaryMin: number | null | undefined,
  band: string
): boolean {
  if (band === 'any') return true
  if (salaryMin == null) return false
  if (band === '0-1000') return salaryMin >= 0 && salaryMin <= 1000
  if (band === '1000-2000') return salaryMin >= 1000 && salaryMin <= 2000
  if (band === '2000+') return salaryMin >= 2000
  return true
}

function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
    </div>
  )
}

function passesModeFilter(job: JobRow, mode: DashboardJobsMode): boolean {
  if (mode === 'all') return true
  if (mode === 'exclude_intern_nss') {
    return job.job_type !== 'intern' && job.job_type !== 'nss'
  }
  return job.job_type === 'intern' || job.job_type === 'nss'
}

export default function GraduateJobsPage() {
  const heading = 'Browse jobs'
  const subheading: string | undefined = undefined
  const mode: DashboardJobsMode = 'all'
  const [rawJobs, setRawJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [appByJobId, setAppByJobId] = useState<
    Record<string, Pick<Application, 'status' | 'match_score'>>
  >({})

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [jobType, setJobType] = useState('')
  const [salaryBand, setSalaryBand] = useState('any')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (cancelled) return
      setUserId(auth.user?.id ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setFetchError('')
      const { data, error } = await supabase
        .from('jobs')
        .select(
          `
          *,
          profiles!jobs_farm_id_fkey ( farm_name )
        `
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setFetchError(error.message)
        setRawJobs([])
      } else {
        setRawJobs((data as JobRow[]) ?? [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setAppByJobId({})
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('job_id, status, match_score')
        .eq('applicant_id', userId)
      if (cancelled) return
      if (error || !data) {
        setAppByJobId({})
        return
      }
      const map: Record<string, Pick<Application, 'status' | 'match_score'>> =
        {}
      for (const row of data) {
        map[row.job_id] = {
          status: row.status as Application['status'],
          match_score: row.match_score,
        }
      }
      setAppByJobId(map)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const modeFiltered = useMemo(
    () => rawJobs.filter((j) => passesModeFilter(j, mode)),
    [rawJobs, mode]
  )

  const filtered = useMemo(() => {
    return modeFiltered.filter((job) => {
      if (region && job.location !== region) return false
      if (jobType && job.job_type !== jobType) return false
      if (!matchesSalaryMin(job.salary_min, salaryBand)) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q)
      )
    })
  }, [modeFiltered, search, region, jobType, salaryBand])

  function clearFilters() {
    setSearch('')
    setRegion('')
    setJobType('')
    setSalaryBand('any')
  }

  const filterSidebar = (
    <div className="space-y-5">
      <div className="flex items-center justify-between lg:hidden">
        <span className="font-semibold text-gray-900">Filters</span>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Input
        label="Search"
        placeholder="Search title or description"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select
        label="Region"
        options={REGION_OPTIONS}
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      />
      <Select
        label="Job type"
        options={JOB_TYPE_OPTIONS}
        value={jobType}
        onChange={(e) => setJobType(e.target.value)}
      />
      <Select
        label="Salary (by minimum)"
        options={SALARY_OPTIONS}
        value={salaryBand}
        onChange={(e) => setSalaryBand(e.target.value)}
      />
      <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
        Clear filters
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
          {subheading ? (
            <p className="mt-1 text-gray-600">{subheading}</p>
          ) : (
            <p className="mt-1 text-gray-600">
              Active roles from verified farms across Ghana
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="mr-2 h-4 w-4" aria-hidden />
            Filters
          </Button>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              aria-label="Close overlay"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 overflow-y-auto bg-gray-50 p-4 lg:static lg:inset-auto lg:z-auto lg:w-72 lg:overflow-visible lg:bg-transparent lg:p-0 ${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block`}
          >
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {filterSidebar}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {fetchError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {fetchError}
              </p>
            ) : null}

            <p className="mb-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {loading ? '-' : filtered.length}
              </span>{' '}
              jobs found
            </p>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((k) => (
                  <JobCardSkeleton key={k} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white">
                <EmptyState
                  icon={<Briefcase className="mx-auto h-12 w-12" />}
                  title="No jobs match your filters"
                  description="Try clearing filters or widening your search."
                  action={{ label: 'Clear filters', onClick: clearFilters }}
                />
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {filtered.map((job) => {
                  const app = appByJobId[job.id]
                  return (
                    <li
                      key={job.id}
                      className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <h2 className="font-semibold text-gray-900">{job.title}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {job.profiles?.farm_name ?? 'Farm'}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                        <MapPin
                          className="h-4 w-4 shrink-0 text-green-700"
                          aria-hidden
                        />
                        {job.location}
                      </p>
                      <div className="mt-2">
                        <Pill variant="gray">{jobTypeLabel(job.job_type)}</Pill>
                      </div>
                      {app ? (
                        <p className="mt-2 text-xs text-gray-600">
                          Match score:{' '}
                          <span className="font-medium text-gray-900">
                            {app.match_score}
                          </span>
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-gray-800">
                        {formatSalaryRange(
                          job.salary_min ?? null,
                          job.salary_max ?? null,
                          job.salary_currency ?? 'GHS'
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Posted {timeAgo(job.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Closes {formatDate(job.expires_at)}
                      </p>
                      <div className="mt-4">
                        <Link href={`/jobs/${job.id}`}>
                          <Button type="button" variant="primary" size="sm">
                            Apply Now
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
      </div>
    </div>
  )
}
