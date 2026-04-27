'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import type { Application, Job, Profile, UserRole } from '@/types'
import { ROLE_LABELS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Select, Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

const LIST_HREF = '/dashboard/admin/applications'

const STATUS_OPTIONS: { value: Application['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

type ApplicantProfile = Profile

type ApplicationRow = Application & {
  jobs: Job | null
  profiles: ApplicantProfile | null
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

const docLinkClass =
  'inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'

export default function AdminApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.id as string

  const [row, setRow] = useState<ApplicationRow | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Application['status']>('pending')
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdminConfirm, setShowAdminConfirm] = useState(false)
  const [adminConfirmText, setAdminConfirmText] = useState('')
  const [isFarmOwnedJob, setIsFarmOwnedJob] = useState(false)
  const [toast, setToast] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const normalizedNotes = reviewNotes.trim()
  const normalizedStoredNotes = (row?.review_notes ?? '').trim()
  const hasChanges =
    !!row &&
    (status !== row.status || (normalizedNotes || '') !== (normalizedStoredNotes || ''))

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current))
    }, 3500)
  }

  async function load() {
    setError('')
    const { data, error: qErr } = await supabase
      .from('applications')
      .select(
        `
        *,
        jobs:job_id (
          id,
          title,
          location,
          city,
          job_type,
          farm_id,
          is_platform_job,
          profiles!jobs_farm_id_fkey (
            farm_name,
            full_name
          )
        ),
        profiles:applicant_id (
          id,
          full_name,
          email,
          phone,
          role,
          qualification,
          specialization,
          years_of_experience,
          preferred_region,
          city,
          cv_url
        )
      `
      )
      .eq('id', applicationId)
      .single()
    if (qErr || !data) {
      console.error('Application fetch error:', qErr)
      console.error(
        'Application fetch error:',
        qErr?.message,
        qErr?.code
      )
      setError('Application not found')
      setRow(null)
      return
    }
    const app = data as ApplicationRow
    const job = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs
    const isOwnedByFarm = job?.farm_id && !job?.is_platform_job
    setIsFarmOwnedJob(!!isOwnedByFarm)
    setRow(app)
    setStatus(app.status)
    setReviewNotes(app.review_notes ?? '')
  }

  useEffect(() => {
    void load()
  }, [applicationId])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (isFarmOwnedJob && !showAdminConfirm) {
      setShowAdminConfirm(true)
      return
    }
    if (isFarmOwnedJob && adminConfirmText.trim().toLowerCase() !== 'i agree') {
      setError('Please type "I Agree" to confirm')
      return
    }
    if (!row) return
    if (!hasChanges) {
      showToast('success', 'No changes to update')
      return
    }
    setSaving(true)
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('Not signed in')
      setSaving(false)
      return
    }
    try {
      await apiClient.updateApplication(applicationId, {
        status,
        review_notes: normalizedNotes || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
      setSaving(false)
      return
    }
    setSaving(false)
    showToast('success', 'Status updated successfully')
    await load()
  }

  if (row === undefined && !error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">Loading application...</p>
      </div>
    )
  }

  if (error || !row || !row.jobs || !row.profiles) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-gray-600">{error || 'Application not found'}</p>
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
  const p = row.profiles
  const role = p.role as UserRole
  const roleLabel = ROLE_LABELS[role] ?? role

  const docs: { label: string; url: string | null | undefined }[] = [
    ...(row.application_cv_url
      ? [{ label: 'Application CV', url: '/api/applications/' + row.id + '/cv' }]
      : []),
    { label: 'CV', url: p.cv_url },
    { label: 'Certificate', url: p.certificate_url },
    { label: 'Transcript', url: p.transcript_url },
    { label: 'NSS letter', url: p.nss_letter_url },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {toast ? (
        <div className="fixed right-4 top-20 z-[90] max-w-sm">
          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-lg',
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      ) : null}
      {showAdminConfirm ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center gap-3'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100'>
                <AlertTriangle className='h-5 w-5 text-amber-600' />
              </div>
              <div>
                <h3 className='font-bold text-gray-900'>Admin Override</h3>
                <p className='text-xs text-gray-500'>
                  This application belongs to a farm job
                </p>
              </div>
            </div>
            <p className='mb-4 text-sm text-gray-600'>
              This job was posted by a farm employer. As admin you are overriding
              their hiring process. Type <strong>I Agree</strong> below to confirm
              you want to proceed.
            </p>
            <input
              type='text'
              value={adminConfirmText}
              onChange={(e) => setAdminConfirmText(e.target.value)}
              placeholder='Type: I Agree'
              className='mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none'
            />
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowAdminConfirm(false)
                  setAdminConfirmText('')
                }}
                className='flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (adminConfirmText.trim().toLowerCase() !== 'i agree') {
                    setError('Please type "I Agree" to confirm')
                    return
                  }
                  setShowAdminConfirm(false)
                  void handleUpdate(new Event('submit') as unknown as React.FormEvent)
                }}
                className='flex-1 rounded-xl bg-amber-500 py-2.5 font-bold text-white hover:bg-amber-600'
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Link
          href={LIST_HREF}
          className="text-sm text-green-700 hover:underline"
        >
          Back to applications
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Applicant</h2>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {p.full_name ?? 'Unnamed'}
              </p>
              <p className="text-sm text-gray-600">{p.email}</p>
              {p.phone ? <p className="text-sm text-gray-600">{p.phone}</p> : null}
              <div className="mt-3">
                <Pill variant="gray">{roleLabel}</Pill>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Region</dt>
                  <dd className="text-gray-900">{p.preferred_region ?? '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Qualification</dt>
                  <dd className="text-gray-900">{p.qualification ?? '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Institution</dt>
                  <dd className="text-gray-900">{p.institution_name ?? '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Specialization</dt>
                  <dd className="text-gray-900">{p.specialization ?? '-'}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {docs.map(({ label, url }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={docLinkClass}
                    >
                      Download {label}
                    </a>
                  ) : null
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">
                Application for
              </h2>
              <p className="mt-2 font-medium text-gray-900">{job.title}</p>
              <div className="mt-4">
                <MatchScoreBar score={row.match_score} />
              </div>
              {row.cover_letter ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Cover letter
                  </h3>
                  <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                    {row.cover_letter}
                  </div>
                </div>
              ) : null}
              <div className="mt-4">
                <span className="text-sm text-gray-600">Current status</span>
                <div className="mt-2">
                  <span className="inline-flex scale-110 transform">
                    <StatusBadge status={row.status} />
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900">
                Update status
              </h2>
              <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Application['status'])
                  }
                />
                <Textarea
                  label="Review notes"
                  name="review_notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || !hasChanges}
                >
                  {saving ? 'Saving...' : 'Update Status'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

