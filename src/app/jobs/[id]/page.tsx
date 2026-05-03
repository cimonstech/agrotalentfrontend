'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Banknote, Building2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile, UserRole } from '@/types'
import { format } from 'date-fns'
import { formatSalaryRange, JOB_TYPES, timeAgo } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import JobBenefits from '@/components/dashboard/JobBenefits'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles: Pick<
    Profile,
    'farm_name' | 'farm_type' | 'farm_location' | 'role'
  > | null
}

type SimilarJobRow = Pick<
  Job,
  | 'id'
  | 'title'
  | 'location'
  | 'city'
  | 'job_type'
  | 'salary_min'
  | 'salary_max'
  | 'salary_currency'
  | 'image_url'
  | 'required_specialization'
  | 'is_platform_job'
> & {
  profiles?:
    | { farm_name?: string | null; full_name?: string | null }
    | { farm_name?: string | null; full_name?: string | null }[]
    | null
}

const CARD_JOB_TYPE_LABEL: Record<string, string> = {
  farm_hand: 'Farm Hand',
  farm_manager: 'Farm Manager',
  graduate: 'Graduate',
  intern: 'Intern',
  nss: 'NSS',
  skilled: 'Skilled Worker',
  data_collector: 'Data Collector',
}

function getSimilarJobFallbackImage(jobType: string, spec: string): string {
  if (spec?.toLowerCase().includes('livestock')) {
    return '/Agriculture-Culture-in-Africa-Images.webp'
  }
  if (jobType === 'farm_manager') {
    return '/vast-farming-land.Bpd1NAnJ.webp'
  }
  if (jobType === 'intern' || jobType === 'nss') {
    return '/image_interns.webp'
  }
  return '/plantainfarm.jpg'
}

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function institutionLabel(
  v: Job['required_institution_type'] | null | undefined
) {
  if (v == null) return null
  if (v === 'university') return 'University'
  if (v === 'training_college') return 'Training college'
  return 'Any'
}

const APPLICANT_ROLES: UserRole[] = ['graduate', 'student', 'skilled']

function getPosterName(
  farm: Pick<Profile, 'farm_name' | 'role'> | null | undefined
) {
  const farmName = farm?.farm_name?.trim() ?? ''
  if (!farmName) return ''
  const normalized = farmName.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (farm?.role === 'admin' || normalized.includes('agrotalent')) {
    return 'AgroTalent Hub'
  }
  return farmName
}

export default function PublicJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<JobRow | null | undefined>(undefined)
  const [similarJobs, setSimilarJobs] = useState<SimilarJobRow[]>([])
  const [loadError, setLoadError] = useState('')
  const similarJobsSectionRef = useRef<HTMLDivElement>(null)
  const similarJobsScrollRef = useRef<HTMLDivElement>(null)

  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileRole, setProfileRole] = useState<UserRole | null>(null)

  const [existingApp, setExistingApp] = useState<Application | null>(null)
  const [appLoading, setAppLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadError('')
      setAuthLoading(true)
      setSimilarJobs([])

      const [jobRes, authRes] = await Promise.all([
        supabase
          .from('jobs')
          .select(
            `
          *,
          profiles!jobs_farm_id_fkey ( farm_name, farm_type, farm_location, role )
        `
          )
          .eq('id', jobId)
          .maybeSingle(),
        supabase.auth.getUser(),
      ])

      if (cancelled) return

      const { data, error } = jobRes
      if (error) {
        setLoadError(error.message)
        setJob(null)
        setSimilarJobs([])
        setAuthUserId(null)
        setProfileRole(null)
        setAuthLoading(false)
        return
      }
      if (!data || data.status !== 'active') {
        setJob(null)
        setSimilarJobs([])
        setAuthUserId(null)
        setProfileRole(null)
        setAuthLoading(false)
        return
      }

      const row = data as JobRow
      setJob(row)

      const uid = authRes.data.user?.id ?? null
      setAuthUserId(uid)
      if (!uid) {
        setProfileRole(null)
        setAuthLoading(false)
        return
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled) return
      setProfileRole((prof?.role as UserRole) ?? null)
      setAuthLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [jobId])

  useEffect(() => {
    if (job === undefined) return
    if (job === null || job.status !== 'active' || job.id !== jobId) {
      setSimilarJobs([])
      return
    }

    let cancelled = false
    const similarSelect =
      'id, title, location, city, job_type, salary_min, salary_max, salary_currency, image_url, required_specialization, is_platform_job, profiles!jobs_farm_id_fkey(farm_name, full_name)'

    const baseSimilar = () =>
      supabase
        .from('jobs')
        .select(similarSelect)
        .eq('status', 'active')
        .is('deleted_at', null)
        .is('hidden_at', null)
        .neq('id', jobId)

    ;(async () => {
      const locRaw = job.location
      const loc = typeof locRaw === 'string' ? locRaw.trim() : ''
      let similar: SimilarJobRow[] = []

      if (loc) {
        const { data: simLoc, error: simLocErr } = await baseSimilar()
          .eq('location', loc)
          .limit(6)
        console.log('similarJobs fetch - job.location:', loc, 'results:', simLoc)
        if (simLocErr) {
          console.warn('similarJobs location query error:', simLocErr)
        }
        if (!simLocErr && Array.isArray(simLoc)) {
          similar = simLoc as SimilarJobRow[]
        }
      }

      if (!cancelled && similar.length < 3) {
        const { data: simWide, error: simWideErr } = await baseSimilar().limit(12)
        console.log('similarJobs fallback fetch - results:', simWide)
        if (simWideErr) {
          console.warn('similarJobs fallback query error:', simWideErr)
        }
        if (!simWideErr && Array.isArray(simWide)) {
          const seen = new Set(similar.map((s) => s.id))
          for (const r of simWide as SimilarJobRow[]) {
            if (similar.length >= 6) break
            if (!seen.has(r.id)) {
              seen.add(r.id)
              similar.push(r)
            }
          }
        }
      }

      if (!cancelled) {
        setSimilarJobs(similar.slice(0, 6))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [job, jobId])

  useEffect(() => {
    if (!authUserId || !job) {
      setExistingApp(null)
      return
    }
    if (!profileRole || !APPLICANT_ROLES.includes(profileRole)) {
      setExistingApp(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setAppLoading(true)
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', job.id)
        .eq('applicant_id', authUserId)
        .maybeSingle()
      if (cancelled) return
      setExistingApp((data as Application) ?? null)
      setAppLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [authUserId, profileRole, job])

  useEffect(() => {
    if (!similarJobs?.length) return
    const root = similarJobsSectionRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.similar-job-card', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: root,
          start: 'top 85%',
          once: true,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [similarJobs])

  if (job === undefined && !loadError) {
    return (
      <main className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-6xl px-4 py-8 lg:px-8'>
          <div className='mb-8 animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:mb-10'>
            <div className='relative min-h-[220px] bg-gray-200 md:min-h-[280px]' />
          </div>
          <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
            <div className='min-w-0 flex-1 space-y-6'>
              <div className='grid grid-cols-3 gap-2 md:gap-3'>
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    className='aspect-[4/3] animate-pulse rounded-xl bg-gray-200'
                  />
                ))}
              </div>
              <div className='h-px bg-gray-200' />
              <div className='space-y-3'>
                <div className='h-6 w-40 animate-pulse rounded-lg bg-gray-200' />
                <div className='h-4 w-full animate-pulse rounded bg-gray-100' />
                <div className='h-4 w-full animate-pulse rounded bg-gray-100' />
                <div className='h-4 w-[85%] animate-pulse rounded bg-gray-100' />
              </div>
              <div className='h-40 animate-pulse rounded-2xl border border-gray-100 bg-white' />
            </div>
            <div className='w-full shrink-0 lg:w-96'>
              <div className='h-56 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm' />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className='min-h-screen bg-gray-50 px-4 py-12'>
        <p className='text-center text-red-600'>{loadError}</p>
      </main>
    )
  }

  if (!job) {
    return (
      <main className='min-h-screen bg-gray-50 px-4 py-12'>
        <div className='mx-auto max-w-lg text-center'>
          <h1 className='text-xl font-semibold text-gray-900'>Job not found</h1>
          <p className='mt-2 text-gray-600'>
            This job is not available or may have been closed.
          </p>
          <Link
            href='/jobs'
            className='mt-6 inline-block text-green-700 hover:underline'
          >
            Back to jobs
          </Link>
        </div>
      </main>
    )
  }

  const farm = job.profiles
  const posterName = getPosterName(farm)
  const signInHref =
    '/signin?redirect=' + encodeURIComponent('/jobs/' + jobId + '/apply')

  const canApply =
    profileRole != null && APPLICANT_ROLES.includes(profileRole)

  const scrollSimilarJobs = (dir: 'left' | 'right') => {
    const el = similarJobsScrollRef.current
    if (!el) return
    const step = Math.max(280, Math.floor(el.clientWidth * 0.75))
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  const galleryImages = [
    {
      src: '/Agriculture-Culture-in-Africa-Images.webp',
      alt: 'Farmers working in the field',
    },
    {
      src: '/vegetable-field.jpg',
      alt: 'Vegetable production',
    },
    {
      src: '/greenhouse1.jpg',
      alt: 'Greenhouse agriculture',
    },
  ] as const

  return (
    <main className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-6xl px-4 py-8 lg:px-8'>
        <section className='relative mb-8 overflow-hidden rounded-2xl border border-gray-200 shadow-lg sm:mb-10'>
          <div className='relative min-h-[220px] md:min-h-[280px]'>
            <Image
              src='/farm_image_header.webp'
              alt=''
              fill
              className='object-cover'
              priority
              sizes='(max-width: 1152px) 100vw, 1152px'
            />
            <div
              className='absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/55 to-forest/30'
              aria-hidden
            />
            <div className='relative z-10 flex min-h-[220px] flex-col justify-end p-6 md:min-h-[280px] md:p-8'>
              <Link
                href='/jobs'
                className='mb-3 inline-flex text-sm font-medium text-white/90 hover:text-white'
              >
                Back to jobs
              </Link>
              <h1 className='text-2xl font-bold text-white md:text-3xl'>
                {job.title}
              </h1>
              <p className='mt-2 text-white/90'>
                {posterName ? (
                  <>
                    <span className='font-medium text-white'>{posterName}</span>
                    <span className='text-white/50'> · </span>
                  </>
                ) : null}
                <span className='inline-flex items-center gap-1'>
                  <MapPin className='h-4 w-4 shrink-0 text-gold' aria-hidden />
                  {job.city
                    ? job.city + ', ' + job.location
                    : job.location}
                </span>
              </p>
              <p className='mt-2 text-sm text-white/75'>
                Posted {timeAgo(job.created_at)}
                {job.expires_at ? (
                  <>
                    {' '}
                    · Closes {format(new Date(job.expires_at), 'dd MMM yyyy')}
                  </>
                ) : null}
              </p>
              <p className='mt-3 font-semibold text-white'>
                {formatSalaryRange(
                  job.salary_min ?? null,
                  job.salary_max ?? null,
                  job.salary_currency ?? 'GHS'
                )}
              </p>
              <div className='mt-3'>
                <Pill
                  variant='gray'
                  className='border border-white/25 bg-white/15 text-white'
                >
                  {jobTypeLabel(job.job_type)}
                </Pill>
              </div>
            </div>
          </div>
        </section>

        <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
          <div className='min-w-0 flex-1 space-y-6'>
            <div className='grid grid-cols-3 gap-2 md:gap-3'>
              {galleryImages.map((img) => (
                <div
                  key={img.src}
                  className='relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm'
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 33vw, 240px'
                  />
                </div>
              ))}
            </div>

            <hr className='border-gray-200' />

            <div>
              <h2 className='text-lg font-semibold text-gray-900'>Description</h2>
              <div
                className='prose prose-sm max-w-none text-gray-600 prose-headings:text-forest prose-strong:text-gray-800 prose-li:text-gray-600 prose-a:text-brand'
                dangerouslySetInnerHTML={{ __html: job.description ?? '' }}
              />
              {job.responsibilities ? (
                <div>
                  <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                    Responsibilities
                  </h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                    dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                  />
                </div>
              ) : null}
              {job.requirements ? (
                <div>
                  <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                    Requirements
                  </h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </div>
              ) : null}
              <JobBenefits job={job} />
            </div>

            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                Required qualifications
              </h2>
              <dl className='mt-3 space-y-2 text-sm'>
                {job.required_qualification ? (
                  <div className='flex flex-col gap-0.5 sm:flex-row sm:gap-4'>
                    <dt className='font-medium text-gray-700'>Qualification</dt>
                    <dd className='text-gray-800'>{job.required_qualification}</dd>
                  </div>
                ) : null}
                {job.required_institution_type ? (
                  <div className='flex flex-col gap-0.5 sm:flex-row sm:gap-4'>
                    <dt className='font-medium text-gray-700'>Institution type</dt>
                    <dd className='text-gray-800'>
                      {institutionLabel(job.required_institution_type)}
                    </dd>
                  </div>
                ) : null}
                {job.required_experience_years != null ? (
                  <div className='flex flex-col gap-0.5 sm:flex-row sm:gap-4'>
                    <dt className='font-medium text-gray-700'>Experience (years)</dt>
                    <dd className='text-gray-800'>
                      {job.required_experience_years}
                    </dd>
                  </div>
                ) : null}
                {job.required_specialization ? (
                  <div className='flex flex-col gap-0.5 sm:flex-row sm:gap-4'>
                    <dt className='font-medium text-gray-700'>Specialization</dt>
                    <dd className='text-gray-800'>{job.required_specialization}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <Card>
              <h2 className='text-lg font-semibold text-gray-900'>Farm</h2>
              <dl className='mt-3 space-y-1 text-sm'>
                <div>
                  <dt className='font-medium text-gray-700'>Name</dt>
                  <dd className='text-gray-800'>{posterName}</dd>
                </div>
                <div>
                  <dt className='font-medium text-gray-700'>Type</dt>
                  <dd className='text-gray-800'>{farm?.farm_type ?? ''}</dd>
                </div>
                <div>
                  <dt className='font-medium text-gray-700'>Location</dt>
                  <dd className='text-gray-800'>{farm?.farm_location ?? ''}</dd>
                </div>
              </dl>
            </Card>
          </div>

          <div className='w-full shrink-0 lg:sticky lg:top-24 lg:w-96'>
            <Card>
              <h2 className='text-lg font-semibold text-gray-900'>
                Apply for this position
              </h2>

              {authLoading ? (
                <p className='mt-4 text-sm text-gray-600'>Checking account...</p>
              ) : !authUserId ? (
                <div className='mt-4'>
                  <Link
                    href={signInHref}
                    className='block w-full rounded-full bg-brand px-8 py-4 text-center font-bold text-white transition-colors hover:bg-forest'
                  >
                    Sign in to Apply
                  </Link>
                </div>
              ) : profileRole === 'farm' || profileRole === 'admin' ? (
                <p className='mt-4 text-sm text-gray-600'>
                  {job.is_platform_job ? 'Platform job' : 'Posted by your farm'}
                </p>
              ) : !canApply ? (
                <p className='mt-4 text-sm text-gray-600'>
                  Your account type cannot apply through this form.
                </p>
              ) : appLoading ? (
                <p className='mt-4 text-sm text-gray-600'>Loading application...</p>
              ) : existingApp ? (
                <div className='mt-4 space-y-2'>
                  <p className='text-sm text-gray-800'>You have already applied</p>
                  <StatusBadge status={existingApp.status} />
                </div>
              ) : (
                <Link
                  href={'/jobs/' + jobId + '/apply'}
                  className='mt-4 block w-full rounded-full bg-brand px-8 py-4 text-center font-bold text-white transition-colors hover:bg-forest'
                >
                  Apply for this Position
                </Link>
              )}
            </Card>
          </div>
        </div>

        {similarJobs && similarJobs.length > 0 && (
          <div ref={similarJobsSectionRef} className='mb-12 mt-12 border-t border-gray-200 pt-12'>
            <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='mb-1 text-xs font-semibold uppercase tracking-widest text-[#2E7D32]'>
                  More From AgroTalentHub
                </p>
                <h2
                  className='text-2xl font-bold text-gray-900'
                  style={{ fontFamily: 'var(--font-sora, sans-serif)' }}
                >
                  More Openings
                </h2>
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <div className='flex items-center gap-1 rounded-full border border-gray-200 bg-white p-0.5 shadow-sm'>
                  <button
                    type='button'
                    onClick={() => scrollSimilarJobs('left')}
                    className='rounded-full p-2 text-[#2E7D32] transition hover:bg-[#F0F7EE]'
                    aria-label='Scroll similar jobs left'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => scrollSimilarJobs('right')}
                    className='rounded-full p-2 text-[#2E7D32] transition hover:bg-[#F0F7EE]'
                    aria-label='Scroll similar jobs right'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
                <Link
                  href='/jobs'
                  className='flex items-center gap-1 text-sm font-semibold text-[#2E7D32] transition hover:text-[#1B5E20]'
                >
                  View all jobs <ChevronRight className='h-4 w-4' />
                </Link>
              </div>
            </div>

            <div className='relative'>
              <div
                ref={similarJobsScrollRef}
                className='flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              >
                {similarJobs.map((sj) => {
                  const sjFarm = Array.isArray(sj.profiles) ? sj.profiles[0] : sj.profiles
                  const farmLabel = sj.is_platform_job
                    ? 'AgroTalentHub'
                    : sjFarm?.farm_name ?? sjFarm?.full_name ?? 'AgroTalentHub'
                  const cardImage =
                    sj.image_url ??
                    getSimilarJobFallbackImage(
                      sj.job_type ?? '',
                      sj.required_specialization ?? ''
                    )

                  return (
                    <Link
                      key={sj.id}
                      href={`/jobs/${sj.id}`}
                      className='similar-job-card group block w-[min(100%,320px)] min-w-[min(100%,320px)] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg sm:w-72 sm:min-w-[288px]'
                    >
                      <div className='relative h-44 w-full overflow-hidden'>
                        <Image
                          src={cardImage}
                          alt={sj.title ?? 'Job opening'}
                          fill
                          className='object-cover transition-transform duration-500 group-hover:scale-105'
                          sizes='320px'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
                        <div className='absolute left-3 top-3'>
                          <span className='rounded-full bg-[#2E7D32] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm'>
                            {CARD_JOB_TYPE_LABEL[sj.job_type ?? ''] ??
                              sj.job_type ??
                              'Role'}
                          </span>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2 p-4'>
                        <h3
                          className='line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[#2E7D32]'
                          style={{ fontFamily: 'var(--font-sora, sans-serif)' }}
                        >
                          {sj.title}
                        </h3>
                        <p className='flex items-center gap-1 text-xs text-gray-500'>
                          <Building2 className='h-3 w-3 shrink-0' />
                          {farmLabel}
                        </p>
                        <p className='flex items-center gap-1 text-xs text-gray-500'>
                          <MapPin className='h-3 w-3 shrink-0 text-[#2E7D32]' />
                          {sj.city ? `${sj.city}, ${sj.location}` : sj.location}
                        </p>
                        {sj.salary_min != null ? (
                          <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-600'>
                            <Banknote className='h-3 w-3 shrink-0 text-[#2E7D32]' />
                            {sj.salary_currency ?? 'GHS'} {sj.salary_min.toLocaleString()}
                            {sj.salary_max != null
                              ? ` - ${sj.salary_max.toLocaleString()}`
                              : ''}
                            {'/mo'}
                          </p>
                        ) : null}
                        <div className='mt-3 flex items-center justify-between border-t border-gray-100 pt-3'>
                          <span className='text-xs font-semibold text-[#2E7D32]'>
                            View Details
                          </span>
                          <ChevronRight className='h-4 w-4 text-[#2E7D32] transition-transform group-hover:translate-x-1' />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
