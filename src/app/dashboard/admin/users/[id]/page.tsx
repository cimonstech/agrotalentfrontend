'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, ChevronRight } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type {
  Application,
  Document,
  Job,
  Placement,
  Profile,
  UserRole,
} from '@/types'
import { formatDate, getInitials, ROLE_LABELS, timeAgo } from '@/lib/utils'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type AppRow = Application & { jobs: Pick<Job, 'title'> | null }
type PlaceRow = Placement & { jobs: Pick<Job, 'title'> | null }

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 py-2 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-700">
        {value}
      </span>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<AppRow[]>([])
  const [placements, setPlacements] = useState<PlaceRow[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: p, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (pErr || !p) {
      setError(pErr?.message ?? 'User not found')
      setProfile(null)
      setLoading(false)
      return
    }
    const prof = p as Profile
    setProfile(prof)

    const [appsRes, placeRes, docsRes] = await Promise.all([
      supabase
        .from('applications')
        .select(
          `
          *,
          jobs ( title )
        `
        )
        .eq('applicant_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('placements')
        .select(
          `
          *,
          jobs ( title )
        `
        )
        .or(`graduate_id.eq.${id},farm_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('documents')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setApplications((appsRes.data as AppRow[]) ?? [])
    setPlacements((placeRes.data as PlaceRow[]) ?? [])
    setDocuments((docsRes.data as Document[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const setVerified = async (next: boolean) => {
    if (!profile) return
    const { data: auth } = await supabase.auth.getUser()
    const adminId = auth.user?.id
    if (!adminId) return
    setBusy(true)
    setMsg('')
    const prev = profile
    setProfile({
      ...profile,
      is_verified: next,
      verified_at: next ? new Date().toISOString() : null,
      verified_by: next ? adminId : null,
    })
    const payload: Record<string, unknown> = {
      is_verified: next,
      updated_at: new Date().toISOString(),
    }
    if (next) {
      payload.verified_at = new Date().toISOString()
      payload.verified_by = adminId
    } else {
      payload.verified_at = null
      payload.verified_by = null
    }
    const { error: uErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
    setBusy(false)
    if (uErr) {
      setProfile(prev)
      setMsg(uErr.message)
      return
    }
    setMsg(next ? 'User verified.' : 'Verification revoked.')

    // In-app notification and email for both verify/revoke actions.
    const notificationType = next
      ? 'verification_approved'
      : 'verification_revoked'
    const notificationTitle = next
      ? 'Account Verified'
      : 'Verification Revoked'
    const notificationMessage = next
      ? 'Your account has been verified. You now have full access to all platform features.'
      : 'Your account verification has been revoked. Please review your profile and contact support if needed.'

    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      link: null,
      read: false,
    })
    if (notifErr) {
      console.error('Notification insert failed:', notifErr)
    }

    try {
      const emailRes = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, type: notificationType }),
      })
      if (!emailRes.ok) {
        const payload = await emailRes.json().catch(() => ({}))
        const reason =
          typeof payload.error === 'string' ? payload.error : 'unknown reason'
        setMsg(
          `${next ? 'User verified.' : 'Verification revoked.'} Email was not sent (${reason}).`
        )
      }
    } catch (emailErr) {
      console.error('Verification email request failed:', emailErr)
      setMsg(
        `${next ? 'User verified.' : 'Verification revoked.'} Email was not sent due to a network error.`
      )
    }

    void load()
  }

  if (loading) {
    return (
      <div className="font-ubuntu flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="font-ubuntu mx-auto max-w-3xl p-6">
        <p className="text-red-600">{error || 'Not found'}</p>
        <Link
          href="/dashboard/admin/users"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Back to users
        </Link>
      </div>
    )
  }

  const displayName =
    profile.role === 'farm' && profile.farm_name?.trim()
      ? profile.farm_name
      : profile.full_name?.trim() || 'User'

  const roleFields: { label: string; value: string }[] = []
  const pushIf = (label: string, v: string | number | null | undefined) => {
    if (v == null || v === '') return
    roleFields.push({ label, value: String(v) })
  }

  if (profile.role === 'farm') {
    pushIf('Farm name', profile.farm_name)
    pushIf('Farm type', profile.farm_type)
    pushIf('Location', profile.farm_location)
  }
  if (profile.role === 'graduate' || profile.role === 'student') {
    pushIf('Institution', profile.institution_name)
    pushIf('Institution type', profile.institution_type)
    pushIf('Qualification', profile.qualification)
    pushIf('Specialization', profile.specialization)
    pushIf('Graduation year', profile.graduation_year)
    pushIf('Preferred region', profile.preferred_region)
    pushIf('NSS status', profile.nss_status)
  }
  if (profile.role === 'skilled') {
    pushIf('Years of experience', profile.years_of_experience)
    pushIf('Specialization', profile.specialization)
    pushIf('Preferred region', profile.preferred_region)
    pushIf('Skills', profile.skills)
    pushIf('Previous employer', profile.previous_employer)
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link href="/dashboard/admin/users" className="hover:text-brand">
            Users
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="font-medium text-gray-800">{displayName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                {getInitials(displayName)}
              </div>
              <h1 className="mt-3 text-xl font-bold text-gray-900">
                {displayName}
              </h1>
              <p className="text-sm text-gray-400">{profile.email}</p>
              <div className="mt-2">
                <Pill variant="gray">
                  {ROLE_LABELS[profile.role as UserRole] ?? profile.role}
                </Pill>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                {profile.is_verified ? (
                  <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className="h-5 w-5 text-green-600"
                        aria-hidden
                      />
                      <span className="font-semibold text-green-700">
                        Verified
                      </span>
                    </div>
                    {profile.verified_at ? (
                      <p className="mt-1 text-xs text-green-600">
                        {formatDate(profile.verified_at)}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setVerified(false)}
                      className="mt-2 text-xs text-red-500 underline disabled:opacity-50"
                    >
                      Revoke Verification
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" aria-hidden />
                      <span className="font-semibold text-amber-700">
                        Pending Verification
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setVerified(true)}
                      className="mt-2 w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>

              {roleFields.length > 0 ? (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {roleFields.map((f) => (
                    <FieldRow key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
              ) : null}

              {msg ? (
                <p className="mt-3 text-sm text-green-700">{msg}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 font-semibold text-gray-800">
                Recent Applications
              </h2>
              <ul className="space-y-0">
                {applications.length === 0 ? (
                  <li className="py-6 text-center text-sm text-gray-400">
                    No applications yet
                  </li>
                ) : (
                  applications.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 py-3 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {a.jobs?.title ?? 'Job'}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-gray-400">
                          {timeAgo(a.created_at)}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 font-semibold text-gray-800">Placements</h2>
              <ul className="space-y-0">
                {placements.length === 0 ? (
                  <li className="py-6 text-center text-sm text-gray-400">
                    No placements
                  </li>
                ) : (
                  placements.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 py-3 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {p.jobs?.title ?? 'Job'}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className="text-xs text-gray-400">
                          {p.start_date
                            ? formatDate(p.start_date)
                            : '-'}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="mb-4 font-semibold text-gray-800">Documents</h2>
              <ul className="space-y-0">
                {documents.length === 0 ? (
                  <li className="py-6 text-center text-sm text-gray-400">
                    No documents
                  </li>
                ) : (
                  documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 py-3 last:border-0"
                    >
                      <span className="text-sm text-gray-800">
                        {d.file_name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill variant="gray">{d.document_type}</Pill>
                        <StatusBadge status={d.status} />
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
