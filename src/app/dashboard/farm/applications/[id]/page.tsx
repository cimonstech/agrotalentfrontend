'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Application, Job, Profile, UserRole } from '@/types'
import { ROLE_LABELS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import ApplicationTimeline from '@/components/dashboard/ApplicationTimeline'

const supabase = createSupabaseClient()

const LIST_HREF = '/dashboard/farm/applications'

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

export default function FarmApplicationReviewPage() {
  const params = useParams()
  const applicationId = params.id as string

  const [row, setRow] = useState<ApplicationRow | null | undefined>(undefined)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Application['status']>('pending')
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
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
    const now = new Date().toISOString()
    const { error: upErr } = await supabase
      .from('applications')
      .update({
        status,
        review_notes: normalizedNotes || null,
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
    try {
      const emailRes = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: row.applicant_id,
          type: 'application_status',
          application_id: row.id,
          status,
          job_title: row.jobs?.title ?? null,
          review_notes: normalizedNotes || null,
        }),
      })
      if (!emailRes.ok) {
        const payload = await emailRes.json().catch(() => ({}))
        const reason =
          typeof payload.error === 'string' ? payload.error : 'unknown reason'
        showToast('error', `Status updated, but email failed: ${reason}`)
      } else {
        showToast('success', 'Status updated and email sent')
      }
    } catch {
      showToast('error', 'Status updated, but email failed due to a network error')
    }
    await load()
  }

  if (row === undefined && !error && !denied) {
    return (
      <div className='min-h-screen bg-gray-50 px-4 py-12'>
        <p className='text-center text-gray-600'>Loading application...</p>
      </div>
    )
  }

  if (denied) {
    return (
      <div className='min-h-screen bg-gray-50 px-4 py-12'>
        <div className='mx-auto max-w-lg text-center'>
          <h1 className='text-xl font-semibold text-gray-900'>Access denied</h1>
          <p className='mt-2 text-gray-600'>
            You do not have access to this application.
          </p>
          <Link
            href={LIST_HREF}
            className='mt-6 inline-block text-green-700 transition-colors hover:text-green-800 hover:underline'
          >
            Back to applications
          </Link>
        </div>
      </div>
    )
  }

  if (error || !row || !row.jobs || !row.profiles) {
    return (
      <div className='min-h-screen bg-gray-50 px-4 py-12'>
        <div className='mx-auto max-w-lg text-center'>
          <p className='text-gray-600'>{error || 'Application not found'}</p>
          <Link
            href={LIST_HREF}
            className='mt-6 inline-block text-green-700 transition-colors hover:text-green-800 hover:underline'
          >
            Back to applications
          </Link>
        </div>
      </div>
    )
  }

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
    <div className='p-4 md:p-6'>
      {toast ? (
        <div className='fixed right-4 top-20 z-[90] max-w-sm'>
          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-lg',
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
            role='status'
            aria-live='polite'
          >
            {toast.message}
          </div>
        </div>
      ) : null}
      <div className='mx-auto max-w-4xl'>
        <Link
          href={LIST_HREF}
          className='mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to applications
        </Link>

        <Card className='mb-4 overflow-hidden p-0'>
          <div className='relative h-32'>
            <Image src='/farm_image_header.webp' alt='' fill className='object-cover object-center' sizes='100vw' />
            <div className='absolute inset-0 bg-gradient-to-b from-forest/30 to-forest/80' />
            <p className='absolute bottom-4 left-6 text-2xl font-bold text-white'>{p.full_name ?? 'Unnamed'}</p>
            <div className='absolute right-6 top-4'>
              <span className='inline-flex rounded-lg border border-white/20 bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
                {row.status}
              </span>
            </div>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <div className='mb-2 flex items-center gap-2 text-sm text-gray-500'>
                  <Mail className='h-4 w-4' />
                  {p.email}
                </div>
                {p.phone ? (
                  <div className='mb-4 flex items-center gap-2 text-sm text-gray-500'>
                    <Phone className='h-4 w-4' />
                    {p.phone}
                  </div>
                ) : null}
                <div className='space-y-2'>
                  <div><p className='text-xs text-gray-400'>Role</p><p className='text-sm font-medium text-gray-900'>{roleLabel}</p></div>
                  <div><p className='text-xs text-gray-400'>Region</p><p className='text-sm font-medium text-gray-900'>{p.preferred_region ?? '-'}</p></div>
                  <div><p className='text-xs text-gray-400'>Institution</p><p className='text-sm font-medium text-gray-900'>{p.institution_name ?? '-'}</p></div>
                  <div><p className='text-xs text-gray-400'>Qualification</p><p className='text-sm font-medium text-gray-900'>{p.qualification ?? '-'}</p></div>
                </div>
              </div>
              <ApplicationTimeline application={row} />
            </div>
          </div>
        </Card>

        <Card className='mb-4 p-5'>
          <h2 className='text-sm font-semibold text-gray-900'>Match Score</h2>
          <p className={cn('text-center text-5xl font-bold', row.match_score >= 70 ? 'text-brand' : row.match_score >= 50 ? 'text-gold' : 'text-red-500')}>
            {Math.max(0, Math.min(100, row.match_score ?? 0))}%
          </p>
          <div className='mt-4 h-3 w-full rounded-full bg-gray-100'>
            <div
              className='h-3 rounded-full bg-gradient-to-r from-brand to-gold'
              style={{ width: `${Math.max(0, Math.min(100, row.match_score ?? 0))}%` }}
            />
          </div>
        </Card>

        <Card className='mb-4 p-5'>
          <h2 className='text-sm font-semibold text-gray-900'>Update Application Status</h2>
          <form className='mt-4 space-y-4' onSubmit={handleUpdate}>
            <div className='grid grid-cols-2 gap-2 md:grid-cols-5'>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    'cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                    status === option.value
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-200 text-gray-600 hover:border-brand/50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Textarea label='Review notes' name='review_notes' value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
            {error ? <p className='text-sm text-red-600'>{error}</p> : null}
            <Button type='submit' variant='primary' disabled={saving || !hasChanges} className='transition-colors hover:bg-forest'>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </Card>

        <Card className='mb-4 p-5'>
          <h2 className='mb-3 text-sm font-semibold text-gray-900'>Submitted Documents</h2>
          <div className='space-y-2'>
            {docs.filter((d) => d.url).length === 0 ? (
              <p className='text-sm text-gray-500'>No documents submitted.</p>
            ) : null}
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                {docs.map(({ label, url }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
                    >
                      <span>{label}</span>
                      <span className='text-brand'>Download</span>
                    </a>
                  ) : null
                )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
