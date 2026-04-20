'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Briefcase, Filter } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  cn,
  GHANA_REGIONS,
  JOB_TYPES,
} from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  JobListingCard,
  type JobListingRow,
} from '@/components/public/JobListingCard'

const supabase = createSupabaseClient()

type JobRow = JobListingRow

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
        <div className="mt-8 h-11 w-full rounded-full bg-gray-100" />
      </div>
    </div>
  )
}

const PAGE_SIZE = 6

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
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

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
          profiles!jobs_farm_id_fkey ( farm_name, is_verified, role, farm_logo_url )
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

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE))

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sortedJobs.slice(start, start + PAGE_SIZE)
  }, [sortedJobs, page])

  useEffect(() => {
    setPage(1)
  }, [search, region, jobType, salaryBand, sortBy])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useLayoutEffect(() => {
    if (loading || paginatedJobs.length === 0) return
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
  }, [loading, paginatedJobs, page])

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
            <h1 className="hero-jobs-anim mt-3 text-3xl font-bold text-white md:text-4xl">
              Browse Agricultural Jobs
            </h1>
            <p className="hero-jobs-anim mt-1 text-base text-white/70">
              Active roles from verified farms across all 16 regions of Ghana
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-forest shadow-sm lg:hidden"
        >
          <Filter className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          Filters
        </button>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside
            className={cn(
              'lg:col-span-1',
              showFilters ? 'block' : 'hidden lg:block'
            )}
          >
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
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {paginatedJobs.map((job, index) => (
                    <JobListingCard
                      key={job.id}
                      ref={(el) => {
                        cardsRef.current[index] = el
                      }}
                      job={job}
                    />
                  ))}
                </div>
                {totalPages > 1 ? (
                  <nav
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                    aria-label="Job results pagination"
                  >
                    <p className="text-sm text-gray-500">
                      Page{' '}
                      <span className="font-semibold text-forest">{page}</span> of{' '}
                      <span className="font-semibold text-forest">{totalPages}</span>
                      <span className="sr-only">
                        {' '}
                        ({sortedJobs.length} jobs)
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
