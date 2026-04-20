'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile } from '@/types'
import {
  formatDate,
  formatSalaryRange,
  JOB_TYPES,
  truncate,
  cn,
} from '@/lib/utils'
import ApplicationTimeline from '@/components/dashboard/ApplicationTimeline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const supabase = createSupabaseClient()

const LIST_HREF = '/dashboard/student/applications'

type FarmProfile = Pick<
  Profile,
  'farm_name' | 'farm_location' | 'farm_type'
>

type JobWithFarm = Job & {
  profiles: FarmProfile | null
}

type ApplicationRow = Application & {
  jobs: JobWithFarm | null
}

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function MatchScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
  const bar =
    pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full max-w-md">
      <div className="mb-1 text-sm font-medium text-gray-900">
        Match score: {pct}%
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function StudentApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [row, setRow] = useState<ApplicationRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [withdrawError, setWithdrawError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        if (!cancelled) {
          setError('Not signed in')
          setRow(null)
        }
        return
      }
      const { data, error: qErr } = await supabase
        .from('applications')
        .select(
          `
          *,
          jobs (
            *,
            profiles!jobs_farm_id_fkey ( farm_name, farm_location, farm_type )
          )
        `
        )
        .eq('id', applicationId)
        .eq('applicant_id', uid)
        .maybeSingle()
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRow(null)
        return
      }
      setRow((data as ApplicationRow) ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [applicationId])

  if (row === undefined && !error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">Loading application...</p>
      </div>
    )
  }

  if (error || !row || !row.jobs) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-gray-600">
            {error || 'Application not found'}
          </p>
          <Link
            href={LIST_HREF}
            className="mt-6 inline-block text-green-700 hover:underline"
          >
            Back to applications
          </Link>
        </div>
      </div>
    )
  }

  const job = row.jobs
  const farm = job.profiles
  const fullDesc = job.description ?? ''
  const descSnippet = truncate(fullDesc, 300)
  const showTruncated = fullDesc.length > 300

  async function handleWithdraw() {
    if (!row) return
    setWithdrawError('')
    const ok = window.confirm(
      `Are you sure you want to withdraw your application for ${job.title}? This cannot be undone.`
    )
    if (!ok) return
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setWithdrawError('You must be signed in.')
      return
    }
    const { error: delErr } = await supabase
      .from('applications')
      .delete()
      .eq('id', row.id)
      .eq('applicant_id', uid)
    if (delErr) {
      setWithdrawError(delErr.message)
      return
    }
    router.push(LIST_HREF)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={LIST_HREF}
          className="text-sm text-green-700 hover:underline"
        >
          Back to applications
        </Link>

        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="mt-1 text-gray-700">{farm?.farm_name ?? 'Farm'}</p>
            <p className="mt-1 text-sm text-gray-600">{job.location}</p>
            <ApplicationTimeline application={row} className="mb-6" />
          </div>

          <Card>
            <MatchScoreBar score={row.match_score} />
          </Card>

          {row.cover_letter ? (
            <Card>
              <h2 className="text-sm font-semibold text-gray-900">
                Cover letter
              </h2>
              <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                {row.cover_letter}
              </div>
            </Card>
          ) : null}

          <p className="text-sm text-gray-600">
            Applied at {formatDate(row.created_at)}
          </p>

          {row.reviewed_at != null ? (
            <Card className="border-blue-100 bg-blue-50/80">
              <h2 className="text-sm font-semibold text-blue-900">
                Farm Feedback
              </h2>
              <p className="mt-2 text-sm text-blue-950 whitespace-pre-wrap">
                {row.review_notes ?? ''}
              </p>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">
              Job details
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="font-medium text-gray-700">Type</dt>
                <dd className="text-gray-900">{jobTypeLabel(job.job_type)}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium text-gray-700">Salary</dt>
                <dd className="text-gray-900">
                  {formatSalaryRange(
                    job.salary_min ?? null,
                    job.salary_max ?? null,
                    job.salary_currency ?? 'GHS'
                  )}
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium text-gray-700">Closes</dt>
                <dd className="text-gray-900">{formatDate(job.expires_at)}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {descSnippet}
              {showTruncated ? ' ' : ''}
              {showTruncated ? (
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-medium text-green-700 hover:underline"
                >
                  Read full listing
                </Link>
              ) : null}
            </div>
          </Card>

          {row.status === 'pending' ? (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="mb-2 text-sm font-semibold text-red-700">
                Withdraw Application
              </p>
              <p className="text-xs text-red-500">
                Withdrawing will remove your application and cannot be undone.
              </p>
              {withdrawError ? (
                <p className="mt-2 text-xs text-red-600">{withdrawError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleWithdraw()}
                className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                Withdraw Application
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
