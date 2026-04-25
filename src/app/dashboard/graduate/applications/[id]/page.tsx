'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, MapPin } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile } from '@/types'
import { formatDate, formatSalaryRange, JOB_TYPES, timeAgo, truncate } from '@/lib/utils'
import ApplicationTimeline from '@/components/dashboard/ApplicationTimeline'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()
const LIST_HREF = '/dashboard/graduate/applications'

type FarmProfile = Pick<Profile, 'farm_name' | 'farm_location' | 'farm_type'>
type JobWithFarm = Job & { profiles: FarmProfile | null }
type ApplicationRow = Application & { jobs: JobWithFarm | null }

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

export default function GraduateApplicationDetailPage() {
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

  async function handleWithdraw() {
    if (!row) return
    setWithdrawError('')
    const ok = window.confirm(`Are you sure you want to withdraw your application for ${row.jobs?.title ?? 'this role'}?`)
    if (!ok) return
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setWithdrawError('You must be signed in.')
      return
    }
    const { error: delErr } = await supabase.from('applications').delete().eq('id', row.id).eq('applicant_id', uid)
    if (delErr) {
      setWithdrawError(delErr.message)
      return
    }
    router.push(LIST_HREF)
  }

  if (row === undefined && !error) {
    return <div className='p-6 text-sm text-gray-600'>Loading application...</div>
  }

  if (error || !row || !row.jobs) {
    return (
      <div className='p-6'>
        <p className='text-sm text-gray-600'>{error || 'Application not found'}</p>
        <Link href={LIST_HREF} className='mt-3 inline-block text-sm font-medium text-brand'>
          Back to applications
        </Link>
      </div>
    )
  }

  const job = row.jobs
  const farm = job.profiles
  const fullDesc = job.description ?? ''
  const descSnippet = truncate(fullDesc, 600)
  const showTruncated = fullDesc.length > 600

  return (
    <div className='p-6'>
      <div className='mx-auto max-w-4xl'>
        <Link href={LIST_HREF} className='mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800'>
          <ArrowLeft className='h-4 w-4' aria-hidden />
          Back to applications
        </Link>

        <Card className='mb-4 p-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{job.title}</h1>
              <p className='mt-1 text-gray-500'>{farm?.farm_name ?? 'Farm'}</p>
              <p className='mt-2 flex items-center gap-1 text-sm text-gray-500'>
                <MapPin className='h-4 w-4' aria-hidden />
                {job.location}
              </p>
            </div>
            <ApplicationTimeline application={row} />
          </div>

          <div className='my-6 border-t border-gray-100' />

          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <div className='rounded-xl bg-gray-50 px-4 py-3 text-center'>
              <p className='text-[10px] uppercase tracking-wide text-gray-400'>Job Type</p>
              <p className='mt-1 text-sm font-semibold text-gray-800'>{jobTypeLabel(job.job_type)}</p>
            </div>
            <div className='rounded-xl bg-gray-50 px-4 py-3 text-center'>
              <p className='text-[10px] uppercase tracking-wide text-gray-400'>Salary</p>
              <p className='mt-1 text-sm font-semibold text-gray-800'>
                {formatSalaryRange(job.salary_min ?? null, job.salary_max ?? null, job.salary_currency ?? 'GHS')}
              </p>
            </div>
            <div className='rounded-xl bg-gray-50 px-4 py-3 text-center'>
              <p className='text-[10px] uppercase tracking-wide text-gray-400'>Expires</p>
              <p className='mt-1 text-sm font-semibold text-gray-800'>{formatDate(job.expires_at)}</p>
            </div>
            <div className='rounded-xl bg-gray-50 px-4 py-3 text-center'>
              <p className='text-[10px] uppercase tracking-wide text-gray-400'>Applied</p>
              <p className='mt-1 text-sm font-semibold text-gray-800'>{timeAgo(row.created_at)}</p>
            </div>
          </div>
        </Card>

        {row.cover_letter ? (
          <Card className='mb-4 p-5'>
            <p className='mb-3 text-xs font-bold uppercase tracking-wide text-gray-400'>Cover Letter</p>
            <div className='rounded-xl bg-gray-50 p-4 text-sm italic leading-relaxed text-gray-600 whitespace-pre-wrap'>{row.cover_letter}</div>
          </Card>
        ) : null}

        {row.reviewed_at ? (
          <Card className='mb-4 border-l-4 border-l-blue-400 p-5'>
            <p className='mb-3 text-xs font-bold uppercase tracking-wide text-blue-600'>Feedback from Farm</p>
            <p className='text-sm text-gray-700 whitespace-pre-wrap'>{row.review_notes ?? ''}</p>
          </Card>
        ) : null}

        <Card className='mb-4 p-5'>
          <h2 className='text-base font-semibold text-gray-900'>About this Role</h2>
          <p className='mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap'>{descSnippet}</p>
          {showTruncated ? (
            <Link href={`/jobs/${job.id}`} className='mt-3 inline-block text-xs font-semibold text-brand'>
              Read more
            </Link>
          ) : null}
        </Card>

        {row.status === 'pending' ? (
          <div className='mt-6 rounded-2xl border border-red-100 bg-red-50 p-4'>
            <p className='text-sm font-semibold text-red-700'>Withdraw Application</p>
            <p className='mt-1 text-xs text-red-500'>Withdrawing removes your application and cannot be undone.</p>
            {withdrawError ? <p className='mt-2 text-xs text-red-600'>{withdrawError}</p> : null}
            <button
              type='button'
              onClick={() => void handleWithdraw()}
              className='mt-3 inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100'
            >
              <Check className='h-4 w-4' aria-hidden />
              Withdraw Application
            </button>
          </div>
        ) : null}

        <div className='mt-3'>
          <Pill variant='gray'>Status: {row.status}</Pill>
        </div>
      </div>
    </div>
  )
}
