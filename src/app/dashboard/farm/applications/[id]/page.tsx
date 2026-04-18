'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile, UserRole } from '@/types'
import { ROLE_LABELS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Select, Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

const LIST_HREF = '/dashboard/farm/applications'

const STATUS_OPTIONS: { value: Application['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
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

export default function FarmApplicationReviewPage() {
  const params = useParams()
  const applicationId = params.id as string

  const [row, setRow] = useState<ApplicationRow | null | undefined>(undefined)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Application['status']>('pending')
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')

  async function load() {
    setError('')
    setConfirmMsg('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('Not signed in')
      setRow(null)
      return
    }
    const { data, error: qErr } = await supabase
      .from('applications')
      .select(
        `
        *,
        jobs!inner ( * ),
        profiles!applications_applicant_id_fkey ( * )
      `
      )
      .eq('id', applicationId)
      .maybeSingle()
    if (qErr) {
      setError(qErr.message)
      setRow(null)
      return
    }
    if (!data) {
      setRow(null)
      return
    }
    const app = data as ApplicationRow
    if (!app.jobs || app.jobs.farm_id !== uid) {
      setDenied(true)
      setRow(null)
      return
    }
    setRow(app)
    setStatus(app.status)
    setReviewNotes(app.review_notes ?? '')
  }

  useEffect(() => {
    void load()
  }, [applicationId])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!row) return
    setSaving(true)
    setConfirmMsg('')
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('Not signed in')
      setSaving(false)
      return
    }
    const now = new Date().toISOString()
    const { error: upErr } = await supabase
      .from('applications')
      .update({
        status,
        review_notes: reviewNotes.trim() || null,
        reviewed_at: now,
        reviewed_by: uid,
      })
      .eq('id', row.id)
      .eq('job_id', row.job_id)
    setSaving(false)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setConfirmMsg('Status updated')
    await load()
  }

  if (row === undefined && !error && !denied) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">Loading application...</p>
      </div>
    )
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-gray-600">
            You do not have access to this application.
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
    { label: 'CV', url: p.cv_url },
    { label: 'Certificate', url: p.certificate_url },
    { label: 'Transcript', url: p.transcript_url },
    { label: 'NSS letter', url: p.nss_letter_url },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h2 className="text-lg font-semibold text-gray-900">
                Applicant
              </h2>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {p.full_name ?? 'Unnamed'}
              </p>
              <p className="text-sm text-gray-600">{p.email}</p>
              {p.phone ? (
                <p className="text-sm text-gray-600">{p.phone}</p>
              ) : null}
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
                {p.years_of_experience != null ? (
                  <div>
                    <dt className="font-medium text-gray-700">
                      Years of experience
                    </dt>
                    <dd className="text-gray-900">{p.years_of_experience}</dd>
                  </div>
                ) : null}
                {p.skills ? (
                  <div>
                    <dt className="font-medium text-gray-700">Skills</dt>
                    <dd className="text-gray-900 whitespace-pre-wrap">
                      {p.skills}
                    </dd>
                  </div>
                ) : null}
                {p.previous_employer ? (
                  <div>
                    <dt className="font-medium text-gray-700">
                      Previous employer
                    </dt>
                    <dd className="text-gray-900">{p.previous_employer}</dd>
                  </div>
                ) : null}
                {(p.reference_name ||
                  p.reference_phone ||
                  p.reference_relationship) && (
                  <div>
                    <dt className="font-medium text-gray-700">Reference</dt>
                    <dd className="text-gray-900">
                      {[p.reference_name, p.reference_phone, p.reference_relationship]
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </div>
                )}
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
                {error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : null}
                {confirmMsg ? (
                  <p className="text-sm text-green-700">{confirmMsg}</p>
                ) : null}
                <Button type="submit" variant="primary" disabled={saving}>
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
