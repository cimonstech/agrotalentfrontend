'use client'

import type { Job } from '@/types'
import { cn } from '@/lib/utils'

export type JobPosterPick =
  | { farm_name?: string | null; full_name?: string | null }
  | null
  | undefined

export type JobSummaryPick = Pick<
  Job,
  | 'title'
  | 'is_sourced_job'
  | 'source_name'
  | 'source_contact_name'
  | 'source_contact'
  | 'source_phone'
  | 'source_email'
  | 'source_platform'
  | 'source_website'
>

export function ApplicationJobSummaryCard({
  job,
  poster,
  className,
}: {
  job: JobSummaryPick
  poster?: JobPosterPick
  className?: string
}) {
  const org =
    poster?.farm_name?.trim() ||
    poster?.full_name?.trim() ||
    'Organisation'

  const sourced = Boolean(job.is_sourced_job)
  const hasSourceDetail =
    sourced &&
    Boolean(
      job.source_name?.trim() ||
        job.source_contact_name?.trim() ||
        job.source_contact?.trim() ||
        job.source_phone?.trim() ||
        job.source_email?.trim() ||
        job.source_platform?.trim() ||
        job.source_website?.trim()
    )

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-left',
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Role
      </p>
      <h2 className="mt-1 text-xl font-bold text-gray-900">{job.title}</h2>
      <p className="mt-2 text-sm text-gray-700">
        Posted by{' '}
        <span className="font-semibold text-gray-900">{org}</span>
      </p>

      {hasSourceDetail ? (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Sourced opportunity — external contact
          </p>
          <dl className="mt-2 space-y-1.5 text-sm text-gray-700">
            {job.source_name?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Organisation / source </dt>
                <dd className="inline font-medium text-gray-900">
                  {job.source_name.trim()}
                </dd>
              </div>
            ) : null}
            {job.source_contact_name?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Contact name </dt>
                <dd className="inline font-medium text-gray-900">
                  {job.source_contact_name.trim()}
                </dd>
              </div>
            ) : null}
            {job.source_contact?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Contact </dt>
                <dd className="inline">{job.source_contact.trim()}</dd>
              </div>
            ) : null}
            {job.source_phone?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Phone </dt>
                <dd className="inline">
                  <a
                    href={`tel:${job.source_phone.trim()}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {job.source_phone.trim()}
                  </a>
                </dd>
              </div>
            ) : null}
            {job.source_email?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Email </dt>
                <dd className="inline">
                  <a
                    href={`mailto:${job.source_email.trim()}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {job.source_email.trim()}
                  </a>
                </dd>
              </div>
            ) : null}
            {job.source_platform?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Platform </dt>
                <dd className="inline">{job.source_platform.trim()}</dd>
              </div>
            ) : null}
            {job.source_website?.trim() ? (
              <div>
                <dt className="inline text-gray-500">Website </dt>
                <dd className="inline">
                  <a
                    href={job.source_website.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    {job.source_website.trim()}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : sourced ? (
        <p className="mt-3 text-xs text-amber-800">
          This listing is sourced externally; add source contact details on the job
          to show them here.
        </p>
      ) : null}
    </div>
  )
}
