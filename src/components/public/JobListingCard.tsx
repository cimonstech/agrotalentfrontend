'use client'

import Link from 'next/link'
import Image from 'next/image'
import { forwardRef } from 'react'
import { Banknote, Building2, CheckCircle2, Clock, MapPin } from 'lucide-react'
import type { Job } from '@/types'
import {
  formatDate,
  formatSalaryRange,
  getInitials,
  JOB_TYPES,
} from '@/lib/utils'

/** Public jobs API returns a subset of Job fields; extras remain optional for Supabase-backed lists. */
export type JobListingRow = Partial<Job> &
  Pick<Job, 'id' | 'title' | 'job_type' | 'location'> & {
    profiles: {
      farm_name?: string | null
      full_name?: string | null
      is_verified?: boolean | null
      role?: string | null
      farm_logo_url?: string | null
    } | null
  }

const NEW_POSTING_MS = 7 * 24 * 60 * 60 * 1000

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function isGoldJobType(jobType: string) {
  return jobType === 'nss' || jobType === 'intern'
}

function isNewPosting(createdAt: string | undefined) {
  if (!createdAt) return false
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 2020) return false
  return Date.now() - d.getTime() < NEW_POSTING_MS
}

function getPosterDisplayName(job: JobListingRow): string {
  if (job.is_platform_job) return 'AgroTalent Hub'
  const profile = job.profiles
  if (!profile) return 'Farm'
  if (profile.role === 'farm') {
    return profile.farm_name?.trim() || 'Farm'
  }
  return (
    profile.farm_name?.trim() ||
    profile.full_name?.trim() ||
    'Farm'
  )
}

function JobCardStatusBadge({ job }: { job: JobListingRow }) {
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

type JobListingCardProps = {
  job: JobListingRow
  href?: string
  /** Slightly tighter padding for dense grids (e.g. homepage) */
  compact?: boolean
}

export const JobListingCard = forwardRef<HTMLDivElement, JobListingCardProps>(
  function JobListingCard({ job, href, compact = false }, ref) {
    const verified = job.profiles?.is_verified === true
    const displayPosterName = getPosterDisplayName(job)
    const farmLogoUrl = job.profiles?.farm_logo_url ?? null
    const useAgroTalentLogo = job.is_platform_job === true
    const salaryText = formatSalaryRange(
      job.salary_min ?? null,
      job.salary_max ?? null,
      job.salary_currency ?? 'GHS'
    )
    const to = href ?? `/jobs/${job.id}`
    const pad = compact ? 'p-5' : 'p-6 md:p-7'

    return (
      <div
        ref={ref}
        className={`flex flex-col rounded-xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-md ${pad}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-bold text-gray-500"
            aria-hidden
          >
            {useAgroTalentLogo ? (
              <Image
                src="/agrotalent-logo.webp"
                alt="AgroTalent Hub"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : farmLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={farmLogoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : displayPosterName ? (
              getInitials(displayPosterName)
            ) : (
              <Building2 className="h-5 w-5 text-gray-400" aria-hidden />
            )}
          </div>
          <JobCardStatusBadge job={job} />
        </div>

        <h2 className="mt-5 truncate text-lg font-bold leading-tight text-forest md:text-xl">
          {job.title}
        </h2>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
          {displayPosterName}
        </p>

        <div className="mt-5 flex-1">
          <div className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <MapPin
                className="h-4 w-4 shrink-0 text-gray-400"
                strokeWidth={1.75}
                aria-hidden
              />
              {job.location}
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
        </div>

        <Link
          href={to}
          className="mt-5 flex w-full items-center justify-center rounded-full bg-brand px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-colors hover:bg-forest"
        >
          View details
        </Link>
      </div>
    )
  }
)
