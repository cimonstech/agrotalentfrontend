'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Document, Profile, UserRole } from '@/types'
import { ROLE_LABELS, timeAgo, cn, getInitials } from '@/lib/utils'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { formatDate, formatCurrency } from '@/lib/utils'
import Image from 'next/image'

const supabase = createSupabaseClient()

type SectionTab = 'profiles' | 'documents'

type DocumentWithUser = Document & {
  user: Pick<Profile, 'full_name' | 'email' | 'role'> | null
}

type DocUser = {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  documents: DocumentWithUser[]
}

const APPLICANT_ROLES: UserRole[] = ['graduate', 'student', 'skilled']

function formatFileSize(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(doc: DocumentWithUser): boolean {
  const n = doc.file_name?.toLowerCase() ?? ''
  const m = doc.mime_type?.toLowerCase() ?? ''
  return n.endsWith('.pdf') || m.includes('pdf')
}

function isImage(doc: DocumentWithUser): boolean {
  const m = doc.mime_type?.toLowerCase() ?? ''
  if (m.startsWith('image/')) return true
  const n = doc.file_name?.toLowerCase() ?? ''
  return /\.(jpe?g|png|webp)$/.test(n)
}

export default function AdminVerificationPage() {
  const [section, setSection] = useState<SectionTab>('profiles')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pendingDocs, setPendingDocs] = useState<DocumentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  const [selectedUser, setSelectedUser] = useState<DocUser | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)
  const [currentDocIndex, setCurrentDocIndex] = useState(0)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setError('')
    setFeedback('')
    const [profsRes, docsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .or('is_verified.eq.false,is_verified.is.null')
        .order('created_at', { ascending: false }),
      supabase
        .from('documents')
        .select(
          '*, user:profiles!documents_user_id_fkey(full_name, email, role)'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    const { data: profs, error: pErr } = profsRes
    const { data: drows, error: dErr } = docsRes
    if (pErr) {
      setError(pErr.message)
      setProfiles([])
    } else {
      setProfiles((profs as Profile[]) ?? [])
    }
    if (dErr) {
      if (!pErr) setError(dErr.message)
      setPendingDocs([])
    } else {
      setPendingDocs((drows as DocumentWithUser[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await loadAll()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [loadAll])

  const groupedByUser: DocUser[] = useMemo(() => {
    return Object.values(
      pendingDocs.reduce(
        (acc, doc) => {
          const uid = doc.user_id
          if (!acc[uid]) {
            acc[uid] = {
              userId: uid,
              userName: doc.user?.full_name ?? 'Unknown',
              userEmail: doc.user?.email ?? '',
              userRole: doc.user?.role ?? '',
              documents: [],
            }
          }
          acc[uid].documents.push(doc)
          return acc
        },
        {} as Record<string, DocUser>
      )
    )
  }, [pendingDocs])

  const handleVerify = async (profileId: string) => {
    setFeedback('')
    setProcessing((prev) => ({ ...prev, [profileId]: true }))
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id ?? null,
        })
        .eq('id', profileId)
      if (upErr) {
        console.error('Verify error:', upErr)
        alert('Verification failed: ' + upErr.message)
        return
      }
      setProfiles((prev) => prev.filter((p) => p.id !== profileId))
      setFeedback('Profile verified')
      void supabase.from('notifications').insert({
        user_id: profileId,
        type: 'verification_approved',
        title: 'Account Verified',
        message:
          'Your account has been verified. You now have full access to all platform features.',
        link: null,
        read: false,
      })
      window.dispatchEvent(new CustomEvent('profile-verified'))
      const emailRes = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileId,
          type: 'verification_approved',
        }),
      })
      if (!emailRes.ok) {
        const payload = await emailRes.json().catch(() => ({}))
        const reason =
          typeof payload.error === 'string' ? payload.error : 'unknown reason'
        setFeedback(`Profile verified, but email failed: ${reason}`)
      }
    } catch (err) {
      console.error('Verify exception:', err)
    } finally {
      setProcessing((prev) => ({ ...prev, [profileId]: false }))
    }
  }

  const handleSkip = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
  }

  const handleApproveAll = async (userId: string, docs: DocumentWithUser[]) => {
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    const ids = docs.map((d) => d.id)
    const { error: upErr } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser?.id ?? null,
      })
      .in('id', ids)

    if (upErr) {
      alert('Failed to approve: ' + upErr.message)
      return
    }

    setPendingDocs((prev) => prev.filter((d) => !ids.includes(d.id)))
    setFeedback('Documents approved')
    if (selectedUser?.userId === userId) {
      setShowDocModal(false)
      setSelectedUser(null)
      setCurrentDocIndex(0)
    }
  }

  const handleApproveDoc = async (docId: string) => {
    const doc = pendingDocs.find((d) => d.id === docId) ?? null
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()
    const { error: upErr } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser?.id ?? null,
      })
      .eq('id', docId)

    if (upErr) {
      alert('Failed to approve: ' + upErr.message)
      return
    }

    setPendingDocs((prev) => prev.filter((d) => d.id !== docId))
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (doc) {
      void fetch('/api/notifications/send-document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session?.access_token ?? ''),
        },
        body: JSON.stringify({
          user_id: doc.user_id,
          document_type: doc.document_type,
          file_name: doc.file_name,
          status: 'approved',
          rejection_reason: null,
        }),
      }).catch(console.error)
    }

    if (!selectedUser) return

    const remaining = selectedUser.documents.filter(
      (d) => d.id !== docId && d.status === 'pending'
    )
    if (remaining.length === 0) {
      setShowDocModal(false)
      setSelectedUser(null)
      setCurrentDocIndex(0)
    } else {
      setCurrentDocIndex(0)
      setSelectedUser((prev) =>
        prev
          ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) }
          : null
      )
    }
    setFeedback('Document approved')
  }

  const handleRejectDoc = async (docId: string, reason: string) => {
    const doc = pendingDocs.find((d) => d.id === docId) ?? null
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()
    const { error: upErr } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser?.id ?? null,
      })
      .eq('id', docId)

    if (upErr) {
      alert('Failed to reject: ' + upErr.message)
      return
    }

    setPendingDocs((prev) => prev.filter((d) => d.id !== docId))
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (doc) {
      void fetch('/api/notifications/send-document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session?.access_token ?? ''),
        },
        body: JSON.stringify({
          user_id: doc.user_id,
          document_type: doc.document_type,
          file_name: doc.file_name,
          status: 'rejected',
          rejection_reason: reason || null,
        }),
      }).catch(console.error)
    }
    setRejectingDocId(null)
    setRejectReason('')

    if (!selectedUser) return

    const remaining = selectedUser.documents.filter(
      (d) => d.id !== docId && d.status === 'pending'
    )
    if (remaining.length === 0) {
      setShowDocModal(false)
      setSelectedUser(null)
      setCurrentDocIndex(0)
    } else {
      setCurrentDocIndex(0)
      setSelectedUser((prev) =>
        prev
          ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) }
          : null
      )
    }
    setFeedback('Document rejected')
  }

  const handleRejectAll = async () => {
    if (!selectedUser) return
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()
    const ids = selectedUser.documents.map((d) => d.id)
    const { error: upErr } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        rejection_reason: rejectReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser?.id ?? null,
      })
      .in('id', ids)

    if (upErr) {
      alert('Failed to reject: ' + upErr.message)
      return
    }

    setPendingDocs((prev) => prev.filter((d) => !ids.includes(d.id)))
    setShowRejectModal(false)
    setSelectedUser(null)
    setRejectReason('')
    setFeedback('Documents rejected')
  }

  const pendingProfilesCount = profiles.length
  const pendingDocsCount = pendingDocs.length

  const safeDocIndex = useMemo(() => {
    if (!selectedUser || selectedUser.documents.length === 0) return 0
    return Math.min(
      currentDocIndex,
      Math.max(0, selectedUser.documents.length - 1)
    )
  }, [selectedUser, currentDocIndex])

  const currentDoc = useMemo(() => {
    if (!selectedUser || selectedUser.documents.length === 0) return null
    return selectedUser.documents[safeDocIndex] ?? null
  }, [selectedUser, safeDocIndex])

  return (
    <div className='font-ubuntu min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl p-6'>
        <DashboardPageHeader
          greeting='Verification Center'
          subtitle={`${pendingProfilesCount + pendingDocsCount} pending reviews`}
        />

        {feedback ? (
          <p className='mt-4 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-800'>
            {feedback}
          </p>
        ) : null}

        {error ? (
          <p className='mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </p>
        ) : null}

        <div className='mt-6 flex gap-6 border-b border-gray-200'>
          <button
            type='button'
            onClick={() => setSection('profiles')}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
              section === 'profiles'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Pending Profiles ({pendingProfilesCount})
          </button>
          <button
            type='button'
            onClick={() => setSection('documents')}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
              section === 'documents'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Pending Documents ({pendingDocsCount})
          </button>
        </div>

        {loading ? (
          <div className='mt-8 space-y-4'>
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className='h-40 animate-pulse rounded-2xl bg-gray-100'
              />
            ))}
          </div>
        ) : section === 'profiles' ? (
          profiles.length === 0 ? (
            <p className='mt-8 text-center text-sm text-gray-400'>
              No pending profiles.
            </p>
          ) : (
            <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
              {profiles.map((p) => {
                const role = p.role as UserRole
                const roleLabel = ROLE_LABELS[role] ?? role
                const isFarm = role === 'farm'
                const isApplicant = APPLICANT_ROLES.includes(role)
                const name = p.full_name ?? 'Unnamed'
                return (
                  <div
                    key={p.id}
                    className='rounded-2xl border border-gray-100 bg-white p-5'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex min-w-0 flex-1 items-start gap-3'>
                        <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600'>
                          {getInitials(name)}
                        </div>
                        <div className='min-w-0'>
                          <p className='font-semibold text-gray-800'>{name}</p>
                          <div className='mt-1 flex flex-wrap items-center gap-2'>
                            <Pill variant='gray'>{roleLabel}</Pill>
                            <span className='text-xs text-gray-400'>
                              {p.created_at ? (
                                timeAgo(p.created_at)
                              ) : (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-shrink-0 flex-col gap-2 sm:flex-row'>
                        <button
                          type='button'
                          disabled={!!processing[p.id]}
                          onClick={() => void handleVerify(p.id)}
                          className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
                        >
                          {processing[p.id] ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                          type='button'
                          onClick={() => handleSkip(p.id)}
                          className='rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-400'
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                    <div className='mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3'>
                      <div>
                        <p className='text-xs text-gray-400'>Email</p>
                        <p className='text-sm text-gray-700'>{p.email}</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-400'>Phone</p>
                        <p className='text-sm text-gray-700'>
                          {p.phone ?? (
                            <span className='text-gray-300 italic text-xs'>
                              Not provided
                            </span>
                          )}
                        </p>
                      </div>
                      {isFarm ? (
                        <>
                          <div>
                            <p className='text-xs text-gray-400'>Farm</p>
                            <p className='text-sm text-gray-700'>
                              {p.farm_name ?? (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-400'>Region</p>
                            <p className='text-sm text-gray-700'>
                              {p.farm_location ?? (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                        </>
                      ) : null}
                      {isApplicant ? (
                        <>
                          <div>
                            <p className='text-xs text-gray-400'>Institution</p>
                            <p className='text-sm text-gray-700'>
                              {p.institution_name ?? (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-400'>
                              Qualification
                            </p>
                            <p className='text-sm text-gray-700'>
                              {p.qualification ?? (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs text-gray-400'>Region</p>
                            <p className='text-sm text-gray-700'>
                              {p.preferred_region ?? (
                                <span className='text-gray-300 italic text-xs'>
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : groupedByUser.length === 0 ? (
          <div className='mt-8'>
            <EmptyState
              icon={<FileText className='mx-auto h-12 w-12' />}
              title='No pending documents'
            />
          </div>
        ) : (
          <div className='mt-6'>
            {groupedByUser.map((row) => {
              const count = row.documents.length
              const roleKey = row.userRole as UserRole
              const roleLabel =
                ROLE_LABELS[roleKey] ?? row.userRole ?? 'Unknown'
              const uniqueTypes = Array.from(
                new Set(row.documents.map((d) => d.document_type))
              ).slice(0, 3)

              return (
                <div
                  key={row.userId}
                  role='button'
                  tabIndex={0}
                  onClick={() => {
                    setSelectedUser(row)
                    setCurrentDocIndex(0)
                    setShowDocModal(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedUser(row)
                      setCurrentDocIndex(0)
                      setShowDocModal(true)
                    }
                  }}
                  className='mb-3 grid cursor-pointer grid-cols-1 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm lg:grid-cols-[minmax(0,1fr)_auto_auto]'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand'>
                      {getInitials(row.userName)}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-gray-800'>
                        {row.userName}
                      </p>
                      <p className='text-xs text-gray-400'>{row.userEmail}</p>
                      <div className='mt-1'>
                        <Pill variant='gray'>{roleLabel}</Pill>
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-shrink-0 flex-wrap items-center justify-center gap-2 lg:justify-center'>
                    <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600'>
                      {count} document{count > 1 ? 's' : ''} pending
                    </span>
                    {uniqueTypes.map((t) => (
                      <span
                        key={t}
                        className='rounded-full bg-brand/10 px-2 py-0.5 text-xs capitalize text-brand'
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className='flex flex-shrink-0 flex-wrap items-center justify-end gap-2'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleApproveAll(row.userId, row.documents)
                      }}
                      className='rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100'
                    >
                      Approve All
                    </button>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedUser(row)
                        setShowRejectModal(true)
                      }}
                      className='rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50'
                    >
                      Reject All
                    </button>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedUser(row)
                        setCurrentDocIndex(0)
                        setShowDocModal(true)
                      }}
                      className='rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest'
                    >
                      Review
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={showDocModal && !!selectedUser}
        onClose={() => {
          setShowDocModal(false)
          setSelectedUser(null)
          setCurrentDocIndex(0)
          setRejectingDocId(null)
          setRejectReason('')
        }}
        title={
          selectedUser
            ? `${selectedUser.userName}: Documents`
            : 'Documents'
        }
        size='lg'
        className='max-w-5xl'
      >
        {selectedUser ? (
          <div className='grid h-[500px] grid-cols-3 gap-4'>
            <div className='col-span-1 flex min-h-0 flex-col overflow-hidden border-r border-gray-100 pr-2'>
              <p className='mb-3 text-xs font-bold uppercase tracking-wide text-gray-400'>
                Documents ({selectedUser.documents.length})
              </p>
              <div className='min-h-0 flex-1 space-y-2 overflow-y-auto pr-1'>
                {selectedUser.documents.map((doc, i) => (
                  <div
                    key={doc.id}
                    onClick={() => setCurrentDocIndex(i)}
                    className={cn(
                      'rounded-xl p-3',
                      safeDocIndex === i
                        ? 'border border-brand/20 bg-brand/10'
                        : 'cursor-pointer bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    <Pill variant='gray' className='capitalize'>
                      {doc.document_type}
                    </Pill>
                    <p className='mt-1 truncate text-xs text-gray-600'>
                      {doc.file_name}
                    </p>
                    <StatusBadge status={doc.status} />
                    {doc.status === 'pending' ? (
                      <div className='mt-2 flex gap-1'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleApproveDoc(doc.id)
                          }}
                          className='rounded-lg bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700'
                        >
                          Approve
                        </button>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            setRejectingDocId(doc.id)
                            setRejectReason('')
                          }}
                          className='rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600'
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                    {rejectingDocId === doc.id ? (
                      <div className='mt-2 rounded-xl border border-red-100 bg-red-50 p-3'>
                        <p className='mb-1 text-xs font-semibold text-red-700'>
                          Reason for rejection
                        </p>
                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder='Enter reason...'
                          className='w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none'
                        />
                        <div className='mt-2 flex gap-2'>
                          <button
                            type='button'
                            onClick={() =>
                              rejectingDocId &&
                              void handleRejectDoc(
                                rejectingDocId,
                                rejectReason
                              )
                            }
                            className='rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white'
                          >
                            Confirm Reject
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setRejectingDocId(null)
                              setRejectReason('')
                            }}
                            className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500'
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div className='col-span-2 flex min-h-0 min-w-0 flex-col'>
              {!currentDoc ? (
                <EmptyState
                  icon={<FileText className='mx-auto h-12 w-12' />}
                  title='No document selected'
                />
              ) : (
                <>
                  <div className='mb-4 flex items-start justify-between'>
                    <div className='min-w-0'>
                      <p className='font-semibold text-gray-800'>
                        {currentDoc.file_name}
                      </p>
                      <div className='mt-1 flex flex-wrap items-center gap-2'>
                        <Pill variant='gray' className='capitalize'>
                          {currentDoc.document_type}
                        </Pill>
                        {currentDoc.file_size != null ? (
                          <span className='text-xs text-gray-400'>
                            {formatFileSize(currentDoc.file_size)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className='flex flex-shrink-0 gap-2'>
                      <a
                        href={currentDoc.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50'
                      >
                        View Full
                        <ExternalLink className='h-3 w-3' aria-hidden />
                      </a>
                      {currentDoc.status === 'pending' ? (
                        <>
                          <button
                            type='button'
                            onClick={() => void handleApproveDoc(currentDoc.id)}
                            className='rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white'
                          >
                            Approve
                          </button>
                          <button
                            type='button'
                            onClick={() => setRejectingDocId(currentDoc.id)}
                            className='rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600'
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {rejectingDocId === currentDoc.id ? (
                    <div className='mb-3 rounded-xl border border-red-100 bg-red-50 p-3'>
                      <p className='mb-1 text-xs font-semibold text-red-700'>
                        Reason for rejection
                      </p>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder='Enter reason...'
                        className='w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none'
                      />
                      <div className='mt-2 flex gap-2'>
                        <button
                          type='button'
                          onClick={() =>
                            rejectingDocId &&
                            void handleRejectDoc(rejectingDocId, rejectReason)
                          }
                          className='rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white'
                        >
                          Confirm Reject
                        </button>
                        <button
                          type='button'
                          onClick={() => {
                            setRejectingDocId(null)
                            setRejectReason('')
                          }}
                          className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className='flex min-h-[300px] flex-1 flex-col'>
                    <div className='flex flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50'>
                      {isPdf(currentDoc) ? (
                        <iframe
                          src={currentDoc.file_url}
                          className='h-[360px] w-full rounded-xl'
                          title={currentDoc.file_name}
                        />
                      ) : isImage(currentDoc) ? (
                        <img
                          src={currentDoc.file_url}
                          alt={currentDoc.file_name}
                          className='max-h-[360px] max-w-full rounded-xl object-contain'
                        />
                      ) : (
                        <div className='flex flex-col items-center px-4 py-8 text-center'>
                          <FileText
                            className='h-12 w-12 text-gray-300'
                            aria-hidden
                          />
                          <p className='mt-2 text-sm text-gray-400'>
                            Preview not available
                          </p>
                          <a
                            href={currentDoc.file_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='mt-2 text-sm font-medium text-brand hover:underline'
                          >
                            View Full
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedUser.documents.length > 1 ? (
                    <div className='mt-3 flex items-center justify-between'>
                      <button
                        type='button'
                        disabled={safeDocIndex === 0}
                        onClick={() =>
                          setCurrentDocIndex(safeDocIndex - 1)
                        }
                        className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40'
                      >
                        Previous
                      </button>
                      <span className='text-xs text-gray-400'>
                        {safeDocIndex + 1} of {selectedUser.documents.length}
                      </span>
                      <button
                        type='button'
                        disabled={
                          safeDocIndex >= selectedUser.documents.length - 1
                        }
                        onClick={() =>
                          setCurrentDocIndex(safeDocIndex + 1)
                        }
                        className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-40'
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showRejectModal && !!selectedUser}
        onClose={() => {
          setShowRejectModal(false)
          setRejectReason('')
        }}
        title='Reject All Documents'
        size='sm'
      >
        {selectedUser ? (
          <div>
            <p className='text-sm text-gray-600'>
              Rejecting all {selectedUser.documents.length} documents for{' '}
              {selectedUser.userName}.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='Enter reason for rejection...'
              className='mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
            />
            <div className='mt-4 flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => void handleRejectAll()}
                className='rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white'
              >
                Reject All
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
