'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Briefcase, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job } from '@/types'
import { cn, formatDate, formatSalaryRange, GHANA_REGIONS, JOB_TYPES, timeAgo } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Badge'
import { markBrowseJobsComplete } from '@/lib/mark-browse-jobs'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles: {
    farm_name: string | null
    full_name?: string | null
    role?: string | null
  } | null
}

type DashboardJobsMode = 'all' | 'exclude_intern_nss' | 'intern_nss_only'

const REGION_OPTIONS = [{ value: '', label: 'All Regions' }, ...GHANA_REGIONS.map((r) => ({ value: r, label: r }))]
const JOB_TYPE_OPTIONS = [{ value: '', label: 'All Types' }, ...JOB_TYPES.map((j) => ({ value: j.value, label: j.label }))]
const SALARY_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '0-1000', label: 'GHS 0-1000' },
  { value: '1000-2000', label: 'GHS 1000-2000' },
  { value: '2000+', label: 'GHS 2000+' },
]

function matchesSalaryMin(salaryMin: number | null | undefined, band: string): boolean {
  if (band === 'any') return true
  if (salaryMin == null) return false
  if (band === '0-1000') return salaryMin >= 0 && salaryMin <= 1000
  if (band === '1000-2000') return salaryMin >= 1000 && salaryMin <= 2000
  if (band === '2000+') return salaryMin >= 2000
  return true
}

function passesModeFilter(job: JobRow, mode: DashboardJobsMode): boolean {
  if (mode === 'all') return true
  if (mode === 'exclude_intern_nss') return job.job_type !== 'intern' && job.job_type !== 'nss'
  return job.job_type === 'intern' || job.job_type === 'nss'
}

function getPosterName(job: JobRow) {
  if (job.is_platform_job) return 'AgroTalent Hub'
  return job.profiles?.farm_name ?? job.profiles?.full_name ?? 'Unknown Farm'
}

export default function GraduateJobsPage() {
  const mode: DashboardJobsMode = 'all'
  const [rawJobs, setRawJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [appByJobId, setAppByJobId] = useState<Record<string, Pick<Application, 'status' | 'match_score'>>>({})
  const [matchByJobId, setMatchByJobId] = useState<Record<string, number>>({})
  const [jobsTab, setJobsTab] = useState<'matched' | 'other'>('matched')
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [jobType, setJobType] = useState('')
  const [salaryBand, setSalaryBand] = useState('any')
  const [sortBy, setSortBy] = useState<'newest' | 'salary' | 'match'>('newest')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (cancelled) return
      setUserId(auth.user?.id ?? null)
      const { data: sessionData } = await supabase.auth.getSession()
      if (cancelled) return
      setAccessToken(sessionData.session?.access_token ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    markBrowseJobsComplete(userId)
  }, [userId])

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
          profiles!jobs_farm_id_fkey ( farm_name, role )
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
      const { data, error } = await supabase.from('applications').select('job_id, status, match_score').eq('applicant_id', userId)
      if (cancelled) return
      if (error || !data) {
        setAppByJobId({})
        return
      }
      const map: Record<string, Pick<Application, 'status' | 'match_score'>> = {}
      for (const row of data) {
        map[row.job_id] = { status: row.status as Application['status'], match_score: row.match_score }
      }
      setAppByJobId(map)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!accessToken) {
      setMatchByJobId({})
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/matches?all_regions=true', { headers: { Authorization: `Bearer ${accessToken}` } })
        const payload = await response.json().catch(() => ({ matches: [] }))
        if (cancelled) return
        const map: Record<string, number> = {}
        for (const item of payload.matches ?? []) {
          const jobId = item?.job?.id
          const score = Number(item?.match_score ?? 0)
          if (jobId && Number.isFinite(score)) map[jobId] = score
        }
        setMatchByJobId(map)
      } catch {
        if (!cancelled) setMatchByJobId({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const modeFiltered = useMemo(() => rawJobs.filter((j) => passesModeFilter(j, mode)), [rawJobs, mode])

  const filtered = useMemo(
    () =>
      modeFiltered.filter((job) => {
        if (region && job.location !== region) return false
        if (jobType && job.job_type !== jobType) return false
        if (!matchesSalaryMin(job.salary_min, salaryBand)) return false
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return job.title.toLowerCase().includes(q) || job.description.toLowerCase().includes(q)
      }),
    [modeFiltered, search, region, jobType, salaryBand]
  )

  const ranked = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sortBy === 'salary') return (b.salary_min ?? 0) - (a.salary_min ?? 0)
      if (sortBy === 'match') return (matchByJobId[b.id] ?? 0) - (matchByJobId[a.id] ?? 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return arr
  }, [filtered, sortBy, matchByJobId])

  const matchedJobs = useMemo(() => ranked.filter((job) => (matchByJobId[job.id] ?? 0) > 0), [ranked, matchByJobId])
  const otherJobs = useMemo(() => ranked.filter((job) => (matchByJobId[job.id] ?? 0) <= 0), [ranked, matchByJobId])
  const tabJobs = jobsTab === 'matched' ? matchedJobs : otherJobs

  function clearFilters() {
    setSearch('')
    setRegion('')
    setJobType('')
    setSalaryBand('any')
  }

  return (
    <div className='p-6'>
      <DashboardPageHeader greeting='Browse Jobs' subtitle={`${loading ? 0 : filtered.length} opportunities`} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        <aside className='lg:col-span-1'>
          <button
            type='button'
            className='mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium lg:hidden'
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <X className='h-4 w-4' /> : <SlidersHorizontal className='h-4 w-4' />}
            Show Filters
          </button>
          <Card className={`${sidebarOpen ? 'block' : 'hidden'} sticky top-24 lg:block`} padding='sm'>
            <p className='mb-4 text-xs font-bold uppercase tracking-wide text-gray-400'>Filters</p>
            <div className='mb-4 border-b border-gray-50 pb-4'>
              <p className='mb-2 text-xs font-semibold text-gray-600'>Search</p>
              <Input placeholder='Search title or description' value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className='mb-4 border-b border-gray-50 pb-4'>
              <p className='mb-2 text-xs font-semibold text-gray-600'>Region</p>
              <Select options={REGION_OPTIONS} value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className='mb-4 border-b border-gray-50 pb-4'>
              <p className='mb-2 text-xs font-semibold text-gray-600'>Job Type</p>
              <Select options={JOB_TYPE_OPTIONS} value={jobType} onChange={(e) => setJobType(e.target.value)} />
            </div>
            <div className='mb-4 border-b border-gray-50 pb-4'>
              <p className='mb-2 text-xs font-semibold text-gray-600'>Salary (min)</p>
              <Select options={SALARY_OPTIONS} value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} />
            </div>
            <Button type='button' variant='outline' className='w-full' onClick={clearFilters}>
              Clear filters
            </Button>
          </Card>
        </aside>

        <section className='lg:col-span-3'>
          {fetchError ? <p className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{fetchError}</p> : null}
          <div className='mb-4 flex items-center justify-between'>
            <p className='text-sm text-gray-500'>
              <span className='font-bold text-gray-900'>{loading ? '-' : tabJobs.length}</span> jobs found
            </p>
            <select
              className='rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm'
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'salary' | 'match')}
            >
              <option value='newest'>Newest</option>
              <option value='salary'>Highest salary</option>
              <option value='match'>Best match</option>
            </select>
          </div>

          <div className='mb-4 inline-flex rounded-xl border border-gray-200 bg-white p-1'>
            <button
              type='button'
              onClick={() => setJobsTab('matched')}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', jobsTab === 'matched' ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              Matched ({matchedJobs.length})
            </button>
            <button
              type='button'
              onClick={() => setJobsTab('other')}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', jobsTab === 'other' ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              Other ({otherJobs.length})
            </button>
          </div>

          {loading ? (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {[0, 1, 2, 3].map((k) => (
                <Card key={k} className='h-44 animate-pulse'>
                  <div />
                </Card>
              ))}
            </div>
          ) : tabJobs.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Briefcase className='mx-auto h-12 w-12' />}
                title={jobsTab === 'matched' ? 'No matched jobs yet' : 'No other jobs match your filters'}
                description='Try clearing filters or widening your search.'
              />
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {tabJobs.map((job, idx) => {
                const app = appByJobId[job.id]
                const posterName = getPosterName(job)
                const imageSrc =
                  idx % 3 === 0 ? '/greenhouse2.jpg' : idx % 3 === 1 ? '/plantainfarm.jpg' : '/Agribusiness.jpg'
                return (
                  <div
                    key={job.id}
                    className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/5'
                  >
                    <div className='relative h-24 overflow-hidden rounded-t-2xl'>
                      <Image src={imageSrc} alt='' fill className='object-cover object-center' sizes='300px' />
                      <div className='absolute inset-0 bg-gradient-to-b from-forest/40 to-forest/70' />
                      <div className='absolute left-3 top-3'>
                        <Pill className='border-white/20 bg-white/20 text-white backdrop-blur-sm'>{job.job_type}</Pill>
                      </div>
                    </div>
                    <div className='p-4'>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-gray-400'>{timeAgo(job.created_at)}</p>
                      </div>
                      <p className='mt-2 line-clamp-1 text-base font-bold text-gray-900'>{job.title}</p>
                      <p className='mt-0.5 text-sm text-gray-400'>{posterName}</p>
                      <p className='mt-1.5 flex items-center gap-1 text-xs text-gray-400'>
                        <MapPin className='h-3.5 w-3.5' aria-hidden />
                        {job.location}
                      </p>
                      <p className='mt-2 text-sm font-semibold text-brand'>
                        {formatSalaryRange(job.salary_min ?? null, job.salary_max ?? null, job.salary_currency ?? 'GHS')}
                      </p>
                      <div className='mt-1.5 flex flex-wrap items-center gap-1'>
                        {job.contract_type ? (
                          <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] capitalize text-gray-500'>
                            {job.contract_type}
                          </span>
                        ) : null}
                        {job.benefits?.accommodation ? (
                          <span className='rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] text-green-700'>
                            Accommodation
                          </span>
                        ) : null}
                        {job.benefits?.commission ? (
                          <span className='rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700'>
                            Commission
                          </span>
                        ) : null}
                      </div>
                      <p className='mt-1 text-xs text-gray-400'>Closes {formatDate(job.expires_at)}</p>
                      <div className='mt-3 border-t border-gray-50 pt-3'>
                        {app ? (
                          <Button type='button' variant='secondary' size='sm' disabled>
                            Applied
                          </Button>
                        ) : (
                          <Link
                            href={`/dashboard/skilled/jobs/${job.id}`}
                            className='inline-flex rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-forest'
                          >
                            Apply Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
