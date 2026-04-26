'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import type { Application, Job, Profile, UserRole } from '@/types'
import {
  formatDate,
  formatSalaryRange,
  JOB_TYPES,
  timeAgo,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

type JobRow = Job & {
  profiles: Pick<
    Profile,
    'farm_name' | 'farm_type' | 'farm_location' | 'role'
  > | null
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
  const [loadError, setLoadError] = useState('')

  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileRole, setProfileRole] = useState<UserRole | null>(null)

  const [existingApp, setExistingApp] = useState<Application | null>(null)
  const [appLoading, setAppLoading] = useState(false)

  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadError('')
      const { data, error } = await supabase
        .from('jobs')
        .select(
          `
          *,
          profiles!jobs_farm_id_fkey ( farm_name, farm_type, farm_location, role )
        `
        )
        .eq('id', jobId)
        .maybeSingle()
      if (cancelled) return
      if (error) {
        setLoadError(error.message)
        setJob(null)
        return
      }
      if (!data || data.status !== 'active') {
        setJob(null)
        return
      }
      setJob(data as JobRow)
    })()
    return () => {
      cancelled = true
    }
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setAuthLoading(true)
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      const uid = data.user?.id ?? null
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

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!job || !authUserId) return
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')
    try {
      await apiClient.createApplication({
        job_id: job.id,
        cover_letter: coverLetter.trim() || null,
      })
      setSubmitSuccess('Application submitted successfully')
      setCoverLetter('')
      const { data: row } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', job.id)
        .eq('applicant_id', authUserId)
        .maybeSingle()
      if (row) setExistingApp(row as Application)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit application'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (job === undefined && !loadError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">Loading job...</p>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-red-600">{loadError}</p>
      </main>
    )
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-gray-900">Job not found</h1>
          <p className="mt-2 text-gray-600">
            This job is not available or may have been closed.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-block text-green-700 hover:underline"
          >
            Back to jobs
          </Link>
        </div>
      </main>
    )
  }

  const farm = job.profiles
  const posterName = getPosterName(farm)
  const signInHref = `/signin?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`

  const canApply =
    profileRole != null && APPLICANT_ROLES.includes(profileRole)

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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200 shadow-lg sm:mb-10">
          <div className="relative min-h-[220px] md:min-h-[280px]">
            <Image
              src="/farm_image_header.webp"
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/55 to-forest/30"
              aria-hidden
            />
            <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-6 md:min-h-[280px] md:p-8">
              <Link
                href="/jobs"
                className="mb-3 inline-flex text-sm font-medium text-white/90 hover:text-white"
              >
                Back to jobs
              </Link>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {job.title}
              </h1>
              <p className="mt-2 text-white/90">
                {posterName ? (
                  <>
                    <span className="font-medium text-white">{posterName}</span>
                    <span className="text-white/50"> · </span>
                  </>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {job.location}
                </span>
              </p>
              <p className="mt-2 text-sm text-white/75">
                Posted {timeAgo(job.created_at)} · Closes{' '}
                {formatDate(job.expires_at)}
              </p>
              <p className="mt-3 font-semibold text-white">
                {formatSalaryRange(
                  job.salary_min ?? null,
                  job.salary_max ?? null,
                  job.salary_currency ?? 'GHS'
                )}
              </p>
              <div className="mt-3">
                <Pill
                  variant="gray"
                  className="border border-white/25 bg-white/15 text-white"
                >
                  {jobTypeLabel(job.job_type)}
                </Pill>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {galleryImages.map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 240px"
                  />
                </div>
              ))}
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
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
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Required qualifications
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                {job.required_qualification ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="font-medium text-gray-700">Qualification</dt>
                    <dd className="text-gray-800">{job.required_qualification}</dd>
                  </div>
                ) : null}
                {job.required_institution_type ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="font-medium text-gray-700">Institution type</dt>
                    <dd className="text-gray-800">
                      {institutionLabel(job.required_institution_type)}
                    </dd>
                  </div>
                ) : null}
                {job.required_experience_years != null ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="font-medium text-gray-700">Experience (years)</dt>
                    <dd className="text-gray-800">
                      {job.required_experience_years}
                    </dd>
                  </div>
                ) : null}
                {job.required_specialization ? (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="font-medium text-gray-700">Specialization</dt>
                    <dd className="text-gray-800">{job.required_specialization}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Farm</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Name</dt>
                  <dd className="text-gray-800">{posterName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Type</dt>
                  <dd className="text-gray-800">{farm?.farm_type ?? ''}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Location</dt>
                  <dd className="text-gray-800">{farm?.farm_location ?? ''}</dd>
                </div>
              </dl>
            </Card>
          </div>

          <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-96">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">
                Apply for this position
              </h2>

              {authLoading ? (
                <p className="mt-4 text-sm text-gray-600">Checking account...</p>
              ) : !authUserId ? (
                <div className="mt-4">
                  <Link href={signInHref}>
                    <Button type="button" variant="primary" className="w-full">
                      Sign in to apply
                    </Button>
                  </Link>
                </div>
              ) : profileRole === 'farm' || profileRole === 'admin' ? (
                <p className="mt-4 text-sm text-gray-600">
                  You cannot apply for jobs
                </p>
              ) : !canApply ? (
                <p className="mt-4 text-sm text-gray-600">
                  Your account type cannot apply through this form.
                </p>
              ) : appLoading ? (
                <p className="mt-4 text-sm text-gray-600">Loading application...</p>
              ) : existingApp ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-800">You have already applied</p>
                  <StatusBadge status={existingApp.status} />
                </div>
              ) : (
                <form className="mt-4 space-y-4" onSubmit={handleApply}>
                  <Textarea
                    label="Cover letter (optional)"
                    name="cover_letter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself and why you fit this role"
                  />
                  {submitSuccess ? (
                    <p className="text-sm text-green-700">{submitSuccess}</p>
                  ) : null}
                  {submitError ? (
                    <p className="text-sm text-red-600">{submitError}</p>
                  ) : null}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
