'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getSessionOnce } from '@/lib/get-session-once'
import { timeAgo } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import {
  MatchBreakdown,
  type MatchBreakdownData,
} from '@/components/dashboard/MatchBreakdown'
import { fetchMatchBreakdown } from '@/lib/fetch-match-breakdown'
import type { Application, Profile } from '@/types'

const supabase = createSupabaseClient()

type PosterProfile = Pick<Profile, 'farm_name' | 'full_name'>

type JobRow = {
  id: string
  title: string
  location: string
  city?: string | null
  job_type: string
  status: string
  profiles: PosterProfile | PosterProfile[] | null
}

type ApplicantProfile = Pick<
  Profile,
  | 'id'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'city'
  | 'preferred_region'
  | 'farm_location'
  | 'qualification'
  | 'specialization'
  | 'role'
  | 'certificate_url'
  | 'transcript_url'
  | 'cv_url'
  | 'nss_letter_url'
>

type ApplicationRow = Pick<
  Application,
  | 'id'
  | 'status'
  | 'match_score'
  | 'cover_letter'
  | 'created_at'
  | 'review_notes'
  | 'application_cv_url'
> & {
  profiles: ApplicantProfile | ApplicantProfile[] | null
}

function oneProfile(
  p: ApplicantProfile | ApplicantProfile[] | null | undefined
): ApplicantProfile | null {
  if (p == null) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

function onePoster(
  p: PosterProfile | PosterProfile[] | null | undefined
): PosterProfile | null {
  if (p == null) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

function applicantRegionLine(profile: ApplicantProfile | null): string | null {
  if (!profile) return null
  const city = profile.city?.trim() || ''
  const region =
    profile.preferred_region?.trim() || profile.farm_location?.trim() || ''
  if (city && region) return `${city}, ${region}`
  if (city) return city
  if (region) return region
  return null
}

function docLinks(
  profile: ApplicantProfile | null,
  applicationCvUrl: string | null | undefined
): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = []
  if (applicationCvUrl?.trim()) {
    out.push({ label: 'Application CV', href: applicationCvUrl.trim() })
  }
  if (profile?.cv_url?.trim()) {
    out.push({ label: 'Profile CV', href: profile.cv_url.trim() })
  }
  if (profile?.certificate_url?.trim()) {
    out.push({ label: 'Certificate', href: profile.certificate_url.trim() })
  }
  if (profile?.transcript_url?.trim()) {
    out.push({ label: 'Transcript', href: profile.transcript_url.trim() })
  }
  if (profile?.nss_letter_url?.trim()) {
    out.push({ label: 'NSS letter', href: profile.nss_letter_url.trim() })
  }
  return out
}

export default function AdminJobApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobRow | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [breakdowns, setBreakdowns] = useState<Record<string, MatchBreakdownData>>({})

  useEffect(() => {
    void fetchData()
  }, [jobId])

  useEffect(() => {
    if (applications.length === 0) return
    let cancelled = false
    void Promise.all(
      applications.map(async (app) => {
        const data = await fetchMatchBreakdown(app.id)
        return data ? { id: app.id, data } : null
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, MatchBreakdownData> = {}
      results.forEach((r) => {
        if (r) map[r.id] = r.data
      })
      setBreakdowns(map)
    })
    return () => {
      cancelled = true
    }
  }, [applications])

  const fetchData = async () => {
    let loadedJob: JobRow | null = null
    try {
      setLoading(true)
      setError('')
      const session = await getSessionOnce()
      if (!session?.user) {
        router.replace('/signin')
        return
      }

      const { data: me, error: profErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profErr) throw profErr
      const role = String((me as { role?: string } | null)?.role ?? '').toLowerCase()
      if (role !== 'admin') {
        router.replace('/signin')
        return
      }

      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select(
          `
          id,
          title,
          location,
          city,
          job_type,
          status,
          profiles!jobs_farm_id_fkey ( farm_name, full_name )
        `
        )
        .eq('id', jobId)
        .maybeSingle()

      if (jobErr) throw jobErr
      if (!jobData) {
        setJob(null)
        setApplications([])
        setError('Job not found')
        return
      }

      loadedJob = jobData as JobRow
      setJob(loadedJob)

      const { data: apps, error: appsErr } = await supabase
        .from('applications')
        .select(
          `
          id,
          status,
          match_score,
          cover_letter,
          created_at,
          review_notes,
          application_cv_url,
          profiles!applications_applicant_id_fkey (
            id,
            full_name,
            email,
            phone,
            city,
            preferred_region,
            farm_location,
            qualification,
            specialization,
            role,
            certificate_url,
            transcript_url,
            cv_url,
            nss_letter_url
          )
        `
        )
        .eq('job_id', jobId)
        .order('match_score', { ascending: false })

      if (appsErr) throw appsErr
      setApplications((apps ?? []) as ApplicationRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setApplications([])
      setJob((prev) => (loadedJob ? prev : null))
    } finally {
      setLoading(false)
    }
  }

  const poster = onePoster(job?.profiles ?? null)
  const farmLabel =
    poster?.farm_name?.trim() ||
    poster?.full_name?.trim() ||
    'Unknown employer'

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent' />
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
        <div className='max-w-md text-center'>
          <p className='text-red-500'>{error}</p>
          <Link
            href='/dashboard/admin/jobs'
            className='mt-4 inline-block text-sm font-semibold text-[#2E7D32] hover:underline'
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 font-ubuntu'>
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <div className='mb-6'>
          <Link
            href='/dashboard/admin/jobs'
            className='mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Jobs
          </Link>
          <h1 className='text-2xl font-bold text-gray-900'>
            {job?.title ?? 'Job'}
          </h1>
          <p className='mt-1 text-sm text-gray-500'>
            {farmLabel} · {job?.location ?? ''}
            {job?.city ? `, ${job.city}` : ''}
          </p>
          <p className='mt-1 text-sm text-gray-400'>
            {applications.length} application
            {applications.length !== 1 ? 's' : ''}
          </p>
          {error ? (
            <p className='mt-2 text-sm text-amber-700'>{error}</p>
          ) : null}
        </div>

        {applications.length === 0 ? (
          <div className='rounded-2xl border border-gray-100 bg-white p-12 text-center'>
            <User className='mx-auto mb-3 h-10 w-10 text-gray-300' />
            <p className='text-gray-400'>No applications yet for this job.</p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {applications.map((app) => {
              const profile = oneProfile(app.profiles)
              const score = Number(app.match_score ?? 0)
              const scoreColor =
                score >= 70
                  ? 'bg-green-50 text-green-700'
                  : score >= 50
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
              const regionLine = applicantRegionLine(profile)
              const docs = docLinks(profile, app.application_cv_url)

              return (
                <div
                  key={app.id}
                  className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
                >
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='flex min-w-0 items-start gap-3'>
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E7D32]/10 text-sm font-bold text-[#2E7D32]'>
                        {(profile?.full_name ?? 'A')
                          .split(/\s+/)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className='min-w-0'>
                        <p className='font-semibold text-gray-900'>
                          {profile?.full_name ?? 'Unknown'}
                        </p>
                        <p className='mt-0.5 text-xs text-gray-500'>
                          {profile?.qualification ?? ''}
                          {profile?.specialization
                            ? ` · ${profile.specialization}`
                            : ''}
                        </p>
                        <p className='mt-0.5 text-xs text-gray-400'>
                          {profile?.role ? `Role: ${profile.role}` : ''}
                        </p>
                        <div className='mt-1 flex flex-wrap items-center gap-3'>
                          {regionLine ? (
                            <span className='flex items-center gap-1 text-xs text-gray-400'>
                              <MapPin className='h-3 w-3 shrink-0' />
                              {regionLine}
                            </span>
                          ) : null}
                          {profile?.email ? (
                            <a
                              href={`mailto:${profile.email}`}
                              className='flex min-w-0 items-center gap-1 text-xs text-[#2E7D32] hover:underline'
                            >
                              <Mail className='h-3 w-3 shrink-0' />
                              <span className='truncate'>{profile.email}</span>
                            </a>
                          ) : null}
                          {profile?.phone ? (
                            <a
                              href={`tel:${profile.phone}`}
                              className='flex items-center gap-1 text-xs text-[#2E7D32] hover:underline'
                            >
                              <Phone className='h-3 w-3 shrink-0' />
                              {profile.phone}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-3'>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor}`}
                      >
                        {score}% match
                      </span>
                      <StatusBadge status={String(app.status ?? '')} />
                    </div>
                  </div>

                  {docs.length > 0 ? (
                    <div className='mt-4 border-t border-gray-100 pt-4'>
                      <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Documents
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {docs.map((d) => (
                          <a
                            key={d.label + d.href}
                            href={d.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100'
                          >
                            <FileText className='h-3.5 w-3.5' />
                            {d.label}
                            <ExternalLink className='h-3 w-3 text-gray-400' />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {app.cover_letter ? (
                    <div className='mt-4 border-t border-gray-100 pt-4'>
                      <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Cover letter
                      </p>
                      <p className='line-clamp-3 text-sm leading-relaxed text-gray-700'>
                        {app.cover_letter}
                      </p>
                    </div>
                  ) : null}

                  {breakdowns[app.id] ? (
                    <MatchBreakdown breakdown={breakdowns[app.id]} />
                  ) : null}

                  {app.review_notes ? (
                    <div className='mt-4 border-t border-gray-100 pt-4'>
                      <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Review notes
                      </p>
                      <p className='text-sm text-gray-700'>{app.review_notes}</p>
                    </div>
                  ) : null}

                  <div className='mt-4 flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>
                      Applied {timeAgo(app.created_at)}
                    </span>
                    <Link
                      href={`/dashboard/admin/applications/${app.id}`}
                      className='text-xs font-semibold text-[#2E7D32] hover:underline'
                    >
                      View full profile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
