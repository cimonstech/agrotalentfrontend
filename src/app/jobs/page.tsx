'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Banknote, Briefcase, CheckCircle2, Clock, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'
import {
  formatDate,
  formatSalaryRange,
  getInitials,
  GHANA_REGIONS,
  JOB_TYPES,
} from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles: {
    farm_name: string | null
    is_verified?: boolean | null
  } | null
}

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
  { value: '500', label: 'GHS 500+' },
  { value: '1000', label: 'GHS 1000+' },
  { value: '2000', label: 'GHS 2000+' },
  { value: '3000', label: 'GHS 3000+' },
]

const SORT_OPTIONS: { value: 'newest' | 'salary_high' | 'salary_low'; label: string }[] =
  [
    { value: 'newest', label: 'Newest first' },
    { value: 'salary_high', label: 'Salary: High to Low' },
    { value: 'salary_low', label: 'Salary: Low to High' },
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
  const threshold = parseInt(band, 10)
  if (Number.isNaN(threshold)) return true
  return salaryMin >= threshold
}

function isGoldJobType(jobType: string) {
  return jobType === 'nss' || jobType === 'intern'
}

const NEW_POSTING_MS = 7 * 24 * 60 * 60 * 1000

function isNewPosting(createdAt: string) {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < NEW_POSTING_MS
}

function JobCardSkeleton() {
  return (
    <div className="h-[340px] animate-pulse rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="h-full p-6 md:p-7">
        <div className="flex justify-between gap-3">
          <div className="h-12 w-12 rounded-lg bg-gray-100" />
          <div className="h-6 w-24 rounded-full bg-gray-100" />
        </div>
        <div className="mt-6 h-7 w-4/5 rounded bg-gray-100" />
        <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-100" />
        </div>
        <div className="mt-8 h-11 w-full rounded-xl bg-gray-100" />
      </div>
    </div>
  )
}

function JobCardStatusBadge({ job }: { job: JobRow }) {
  if (isNewPosting(job.created_at)) {
    return (
      <span className="whitespace-nowrap rounded-full border border-brand/25 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
        New posting
      </span>
    )
  }
  if (isGoldJobType(job.job_type)) {
    return (
      <span className="whitespace-nowrap rounded-full border border-gold/35 bg-gold/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bark">
        {jobTypeLabel(job.job_type)}
      </span>
    )
  }
  return (
    <span className="whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
      {jobTypeLabel(job.job_type)}
    </span>
  )
}

export default function PublicJobsPage() {
  const [rawJobs, setRawJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [jobType, setJobType] = useState('')
  const [salaryBand, setSalaryBand] = useState('any')
  const [sortBy, setSortBy] = useState<'newest' | 'salary_high' | 'salary_low'>(
    'newest'
  )

  const heroRef = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

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
          profiles!jobs_farm_id_fkey ( farm_name, is_verified )
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
    const root = heroRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.hero-jobs-anim', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const filtered = useMemo(() => {
    return rawJobs.filter((job) => {
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
  }, [rawJobs, search, region, jobType, salaryBand])

  const sortedJobs = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'newest') {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else if (sortBy === 'salary_high') {
      list.sort((a, b) => {
        const am = a.salary_max
        const bm = b.salary_max
        if (am == null && bm == null) return 0
        if (am == null) return 1
        if (bm == null) return -1
        return bm - am
      })
    } else {
      list.sort((a, b) => {
        const am = a.salary_min
        const bm = b.salary_min
        if (am == null && bm == null) return 0
        if (am == null) return 1
        if (bm == null) return -1
        return am - bm
      })
    }
    return list
  }, [filtered, sortBy])

  useLayoutEffect(() => {
    if (loading || sortedJobs.length === 0) return
    const els = cardsRef.current.filter(
      (n): n is HTMLDivElement => n != null
    )
    if (els.length === 0) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: els[0],
            start: 'top 85%',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [loading, sortedJobs])

  function clearFilters() {
    setSearch('')
    setRegion('')
    setJobType('')
    setSalaryBand('any')
  }

  const filterForm = (
    <>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-forest">
        Filter results
      </h2>
      <div>
        <label
          htmlFor="jobs-search"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Search
        </label>
        <input
          id="jobs-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Job title or keyword"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder-gray-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div className="mt-4">
        <label
          htmlFor="jobs-region"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Region
        </label>
        <select
          id="jobs-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {REGION_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label
          htmlFor="jobs-type"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Job Type
        </label>
        <select
          id="jobs-type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {JOB_TYPE_OPTIONS.map((o) => (
            <option key={o.value || 'all-types'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label
          htmlFor="jobs-salary"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Salary (min)
        </label>
        <select
          id="jobs-salary"
          value={salaryBand}
          onChange={(e) => setSalaryBand(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {SALARY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={clearFilters}
        className="mt-6 w-full rounded-full border border-gray-200 py-2.5 text-sm text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
      >
        Clear filters
      </button>
    </>
  )

  return (
    <main className="min-h-screen bg-gray-50 font-ubuntu">
      <section
        ref={heroRef}
        className="relative h-52 w-full overflow-hidden"
      >
        <Image
          src="/vast-farming-land.Bpd1NAnJ.webp"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-forest/75" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <span className="hero-jobs-anim inline-flex rounded-full border border-gold/30 bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              FIND YOUR ROLE IN AGRICULTURE
            </span>
            <h1 className="hero-jobs-anim mt-3 text-4xl font-bold text-white">
              Browse Agricultural Jobs
            </h1>
            <p className="hero-jobs-anim mt-1 text-base text-white/70">
              Active roles from verified farms across all 16 regions of Ghana
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200/80 bg-emerald-50/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-sm">
              {filterForm}
            </div>
          </aside>

          <div className="lg:col-span-3">
            {fetchError ? (
              <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {fetchError}
              </p>
            ) : null}

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-forest">
                  {loading ? '-' : filtered.length}
                </span>{' '}
                jobs found
              </p>
              <label htmlFor="jobs-sort" className="sr-only">
                Sort jobs
              </label>
              <select
                id="jobs-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'newest' | 'salary_high' | 'salary_low')
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[0, 1, 2, 3].map((k) => (
                  <JobCardSkeleton key={k} />
                ))}
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white">
                <EmptyState
                  icon={<Briefcase className="mx-auto h-12 w-12" />}
                  title="No jobs found"
                  description="Try adjusting your filters"
                  action={{ label: 'Clear filters', onClick: clearFilters }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {sortedJobs.map((job, index) => {
                  const verified = job.profiles?.is_verified === true
                  const farmName = job.profiles?.farm_name ?? 'Farm'
                  const salaryText = formatSalaryRange(
                    job.salary_min ?? null,
                    job.salary_max ?? null,
                    job.salary_currency ?? 'GHS'
                  )
                  return (
                    <div
                      key={job.id}
                      ref={(el) => {
                        cardsRef.current[index] = el
                      }}
                      className="flex flex-col rounded-xl border border-gray-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-md md:p-7"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-bold text-gray-500"
                          aria-hidden
                        >
                          {getInitials(farmName)}
                        </div>
                        <JobCardStatusBadge job={job} />
                      </div>

                      <h2 className="mt-5 line-clamp-2 text-xl font-bold leading-snug text-forest md:text-2xl md:leading-snug">
                        {job.title}
                      </h2>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                        {farmName}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-gray-400"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock
                            className="h-4 w-4 shrink-0 text-gray-400"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {jobTypeLabel(job.job_type)}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <Banknote
                            className="h-4 w-4 shrink-0 text-gray-400"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span className="truncate">{salaryText}</span>
                        </span>
                      </div>

                      {job.expires_at != null && job.expires_at !== '' ? (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock
                            className="h-3.5 w-3.5 shrink-0 text-gray-300"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          Closes {formatDate(job.expires_at)}
                        </p>
                      ) : null}

                      {verified ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Verified farm
                        </p>
                      ) : null}

                      <Link
                        href={`/jobs/${job.id}`}
                        className="mt-6 flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-gray-800 transition-colors hover:border-forest/35 hover:bg-gray-50/90 hover:text-forest"
                      >
                        View details
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
