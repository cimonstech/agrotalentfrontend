'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mail, MessageSquare, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import type { CommunicationLog, EmailLog, Profile, UserRole } from '@/types'
import { cn, formatDate, truncate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
const supabase = createSupabaseClient()

type Tab = 'send' | 'logs' | 'email_logs'
type TargetMode = 'audience' | 'single'

type RecipientUser = Pick<
  Profile,
  | 'id'
  | 'full_name'
  | 'farm_name'
  | 'email'
  | 'phone'
  | 'role'
>

const MESSAGE_MERGE_TAGS: { token: string; label: string }[] = [
  { token: '{{name}}', label: 'Name' },
  { token: '{{first_name}}', label: 'First name' },
  { token: '{{full_name}}', label: 'Full name' },
  { token: '{{farm_name}}', label: 'Farm name' },
  { token: '{{role}}', label: 'Role' },
  { token: '{{email}}', label: 'Email' },
]

const SMS_MERGE_TAGS: { token: string; label: string }[] = [
  { token: '{{name}}', label: 'Name' },
  { token: '{{first_name}}', label: 'First name' },
  { token: '{{full_name}}', label: 'Full name' },
  { token: '{{farm_name}}', label: 'Farm name' },
  { token: '{{role}}', label: 'Role' },
]

const AUDIENCE_ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: 'farm', label: 'Farms' },
  { role: 'graduate', label: 'Graduates' },
  { role: 'student', label: 'Students' },
  { role: 'skilled', label: 'Skilled Workers' },
]

function isSmsLogType(t: string): boolean {
  return t === 'sms' || t === 'bulk_sms' || t.startsWith('sms')
}

function metaMessage(m: unknown): string {
  if (!m || typeof m !== 'object') return ''
  const v = (m as Record<string, unknown>).message
  return typeof v === 'string' ? v : ''
}

function previewSmsBody(text: string): string {
  const sample = {
    name: 'Ama Farm',
    first_name: 'Ama',
    full_name: 'Ama Mensah',
    farm_name: 'Green Valley Farm',
    role: 'farm',
    email: 'sample@example.com',
  }
  let out = text
  out = out.replace(/\{\{\s*name\s*\}\}/gi, sample.name)
  out = out.replace(/\{\{\s*first_name\s*\}\}/gi, sample.first_name)
  out = out.replace(/\{\{\s*full_name\s*\}\}/gi, sample.full_name)
  out = out.replace(/\{\{\s*farm_name\s*\}\}/gi, sample.farm_name)
  out = out.replace(/\{\{\s*role\s*\}\}/gi, sample.role)
  out = out.replace(/\{\{\s*email\s*\}\}/gi, sample.email)
  return out
}

function RowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className='animate-pulse border-b border-gray-50'>
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className='px-4 py-3'>
          <div className='h-4 rounded bg-gray-100' />
        </td>
      ))}
    </tr>
  )
}

type EmailStats = {
  totalSmsSent: number
  totalEmailsSent: number
  smsDeliveryPct: number
  thisMonth: number
}

export default function AdminCommunicationsPage() {
  const [tab, setTab] = useState<Tab>('send')
  const [type, setType] = useState<'email' | 'sms'>('email')
  const [targetMode, setTargetMode] = useState<TargetMode>('audience')
  const [audienceRoles, setAudienceRoles] = useState<UserRole[]>([])
  const [users, setUsers] = useState<RecipientUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<RecipientUser | null>(null)
  const [showUserPicker, setShowUserPicker] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendOk, setSendOk] = useState('')
  const [sendErr, setSendErr] = useState('')
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [emailLogsLoading, setEmailLogsLoading] = useState(false)
  const [emailTypeFilter, setEmailTypeFilter] = useState('all')
  const [emailStatusFilter, setEmailStatusFilter] = useState('all')
  const [expandedEmailErrorId, setExpandedEmailErrorId] = useState<string | null>(
    null
  )
  const [expandedLog, setExpandedLog] = useState<CommunicationLog | null>(null)
  const [expandedEmailLog, setExpandedEmailLog] = useState<EmailLog | null>(null)

  const [stats, setStats] = useState<EmailStats>({
    totalSmsSent: 0,
    totalEmailsSent: 0,
    smsDeliveryPct: 0,
    thisMonth: 0,
  })

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data } = await supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLogs((data as CommunicationLog[]) ?? [])
    setLogsLoading(false)
  }, [])

  const loadEmailLogs = useCallback(async () => {
    setEmailLogsLoading(true)
    try {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100)
      setEmailLogs((data as EmailLog[]) ?? [])
    } finally {
      setEmailLogsLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    const { data } = await supabase
      .from('email_logs')
      .select('type, status, sent_at')
      .limit(3000)
    const rows =
      (data as Pick<EmailLog, 'type' | 'status' | 'sent_at'>[] | null) ?? []
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalSmsSent = rows.filter(
      (r) => isSmsLogType(r.type) && r.status === 'sent'
    ).length
    const totalEmailsSent = rows.filter(
      (r) => !isSmsLogType(r.type) && r.status === 'sent'
    ).length
    const smsRows = rows.filter((r) => isSmsLogType(r.type))
    const smsSent = smsRows.filter((r) => r.status === 'sent').length
    const smsTotal = smsRows.length
    const smsDeliveryPct =
      smsTotal > 0 ? Math.round((smsSent / smsTotal) * 100) : 0
    const thisMonth = rows.filter(
      (r) => new Date(r.sent_at) >= startMonth
    ).length
    setStats({
      totalSmsSent,
      totalEmailsSent,
      smsDeliveryPct,
      thisMonth,
    })
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (tab === 'logs') void loadLogs()
  }, [tab, loadLogs])

  useEffect(() => {
    if (tab !== 'email_logs') return
    void loadEmailLogs()
    void loadStats()
  }, [tab, loadEmailLogs, loadStats])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setUsersLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, farm_name, email, phone, role')
        .neq('role', 'admin')
        .order('full_name', { ascending: true })
      if (!cancelled) {
        setUsers((data as RecipientUser[]) ?? [])
        setUsersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return true
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.farm_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    )
  })

  const displayRecipientLabel = (u: RecipientUser) =>
    u.full_name?.trim() || u.farm_name?.trim() || 'Unnamed'

  const audienceRecipientCount = useMemo(() => {
    if (targetMode === 'single') {
      if (!selectedUser) return 0
      if (type === 'email') return selectedUser.email?.trim() ? 1 : 0
      return selectedUser.phone?.trim() ? 1 : 0
    }
    let list = users
    if (audienceRoles.length > 0) {
      list = users.filter((u) =>
        audienceRoles.includes(u.role as UserRole)
      )
    }
    if (type === 'email') {
      return list.filter((u) => u.email?.trim()).length
    }
    return list.filter((u) => u.phone?.trim()).length
  }, [targetMode, selectedUser, users, audienceRoles, type])

  const smsCharCount = message.length
  const smsCounterClass =
    smsCharCount < 160
      ? 'text-green-600'
      : smsCharCount <= 320
        ? 'text-amber-600'
        : 'text-red-600'

  const appendMergeAtCursor = (token: string) => {
    const el = messageInputRef.current
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart
      const end = el.selectionEnd ?? start
      const next =
        message.slice(0, start) + token + message.slice(end)
      setMessage(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
      })
      return
    }
    setMessage((prev) => {
      if (!prev) return token
      const needsSpace = !/\s$/.test(prev)
      return prev + (needsSpace ? ' ' : '') + token
    })
  }

  const toggleAudienceRole = (role: UserRole) => {
    setAudienceRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSendErr('')
    setSendOk('')
    if (type === 'email' && !subject.trim()) {
      setSendErr('Subject is required for email.')
      return
    }
    if (!message.trim()) {
      setSendErr('Message is required.')
      return
    }
    if (targetMode === 'single' && !selectedUser) {
      setSendErr('Select one recipient from the user list.')
      return
    }
    if (targetMode === 'single' && type === 'email' && !selectedUser?.email) {
      setSendErr('Selected user has no email address.')
      return
    }
    if (targetMode === 'single' && type === 'sms' && !selectedUser?.phone) {
      setSendErr('Selected user has no phone number for SMS.')
      return
    }
    if (targetMode === 'audience' && audienceRecipientCount === 0) {
      setSendErr(
        type === 'email'
          ? 'No recipients with an email match your selection.'
          : 'No recipients with a phone number match your selection.'
      )
      return
    }
    setSending(true)
    try {
      const audienceToApi: Record<
        string,
        'farms' | 'graduates' | 'students' | 'skilled'
      > = {
        farm: 'farms',
        graduate: 'graduates',
        student: 'students',
        skilled: 'skilled',
      }

      let recipients:
        | 'all'
        | 'farms'
        | 'graduates'
        | 'students'
        | 'skilled'
        | 'single'
        | 'custom'
      let customUserIds: string[] | undefined

      if (targetMode === 'single') {
        recipients = 'single'
      } else if (audienceRoles.length === 0) {
        recipients = 'all'
      } else if (audienceRoles.length === 1) {
        recipients = audienceToApi[audienceRoles[0]] ?? 'all'
      } else {
        recipients = 'custom'
        customUserIds = users
          .filter((u) => audienceRoles.includes(u.role as UserRole))
          .map((u) => u.id)
      }

      const res = (await apiClient.sendCommunication({
        type,
        recipients,
        subject: type === 'email' ? subject.trim() : undefined,
        message: message.trim(),
        userId: targetMode === 'single' ? selectedUser?.id : undefined,
        customUserIds,
      })) as { message?: string }
      setSendOk(res.message ?? 'Sent.')
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : 'Failed to send.')
      setSending(false)
      return
    }
    setSending(false)
    setSubject('')
    setMessage('')
    setAudienceRoles([])
    setSelectedUser(null)
    setUserSearch('')
    setShowUserPicker(false)
    void loadLogs()
    void loadStats()
  }

  return (
    <div className='font-ubuntu min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl p-6'>
        <DashboardPageHeader
          greeting='Communications'
          subtitle='Send messages and view logs'
        />

        <div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-2xl font-bold text-gray-900'>{stats.totalSmsSent}</p>
            <p className='mt-1 text-xs uppercase tracking-wide text-gray-400'>
              Total SMS sent
            </p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-2xl font-bold text-gray-900'>
              {stats.totalEmailsSent}
            </p>
            <p className='mt-1 text-xs uppercase tracking-wide text-gray-400'>
              Total emails sent
            </p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-2xl font-bold text-gray-900'>
              {stats.smsDeliveryPct}%
            </p>
            <p className='mt-1 text-xs uppercase tracking-wide text-gray-400'>
              SMS delivery rate
            </p>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-2xl font-bold text-gray-900'>{stats.thisMonth}</p>
            <p className='mt-1 text-xs uppercase tracking-wide text-gray-400'>
              This month
            </p>
          </div>
        </div>

        <div className='mt-2 flex gap-6 border-b border-gray-200'>
          <button
            type='button'
            onClick={() => setTab('send')}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
              tab === 'send'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Send Message
          </button>
          <button
            type='button'
            onClick={() => setTab('logs')}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
              tab === 'logs'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Message Logs
          </button>
          <button
            type='button'
            onClick={() => setTab('email_logs')}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
              tab === 'email_logs'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Email Logs
          </button>
        </div>

        {expandedLog ? (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            role='presentation'
            onClick={() => setExpandedLog(null)}
          >
            <div
              role='dialog'
              aria-modal='true'
              className='max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='mb-4 flex items-start justify-between gap-4'>
                <span className='inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-800'>
                  {expandedLog.type}
                </span>
                <button
                  type='button'
                  onClick={() => setExpandedLog(null)}
                  className='rounded-lg p-1 text-gray-500 hover:bg-gray-100'
                  aria-label='Close'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                Recipients
              </p>
              <p className='mt-1 text-sm text-gray-800'>{expandedLog.recipients}</p>
              <p className='mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400'>
                Message
              </p>
              <p className='mt-1 whitespace-pre-wrap text-sm text-gray-800'>
                {expandedLog.message}
              </p>
              <div className='mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600'>
                <span>Status: {expandedLog.status}</span>
                <span>
                  Count: {expandedLog.success_count} / {expandedLog.recipient_count}
                </span>
                <span className='text-xs text-gray-400'>
                  {formatDate(expandedLog.created_at, 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {expandedEmailLog ? (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            role='presentation'
            onClick={() => setExpandedEmailLog(null)}
          >
            <div
              role='dialog'
              aria-modal='true'
              className='max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='mb-4 flex items-start justify-between gap-4'>
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    expandedEmailLog.type === 'bulk_sms' ||
                      expandedEmailLog.type === 'sms'
                      ? 'bg-teal-50 text-teal-800'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {expandedEmailLog.type}
                </span>
                <button
                  type='button'
                  onClick={() => setExpandedEmailLog(null)}
                  className='rounded-lg p-1 text-gray-500 hover:bg-gray-100'
                  aria-label='Close'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                Recipient
              </p>
              <p className='mt-1 text-sm text-gray-800'>
                {expandedEmailLog.recipient_name ?? expandedEmailLog.recipient_email}
              </p>
              <p className='mt-1 text-xs text-gray-500'>
                {expandedEmailLog.recipient_email}
              </p>
              <p className='mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400'>
                Subject
              </p>
              <p className='mt-1 text-sm text-gray-800'>{expandedEmailLog.subject}</p>
              <p className='mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400'>
                Message
              </p>
              <p className='mt-1 whitespace-pre-wrap text-sm text-gray-800'>
                {metaMessage(expandedEmailLog.metadata) ||
                  '(no message in metadata)'}
              </p>
              {expandedEmailLog.metadata &&
              typeof expandedEmailLog.metadata === 'object' &&
              Object.keys(expandedEmailLog.metadata).length > 0 ? (
                <div className='mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600'>
                  <p className='font-semibold text-gray-700'>Metadata</p>
                  <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all'>
                    {JSON.stringify(expandedEmailLog.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
              <div className='mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4'>
                <StatusBadge status={expandedEmailLog.status} />
                <span className='text-xs text-gray-400'>
                  {formatDate(expandedEmailLog.sent_at, 'dd MMM yyyy HH:mm')}
                </span>
              </div>
              {expandedEmailLog.error_message ? (
                <p className='mt-3 rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-red-700'>
                  {expandedEmailLog.error_message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'send' ? (
          <form
            onSubmit={onSubmit}
            className='mt-6 space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'
          >
            {sendErr ? (
              <p className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {sendErr}
              </p>
            ) : null}
            {sendOk ? (
              <p className='rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800'>
                {sendOk}
              </p>
            ) : null}

            <div>
              <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Channel
              </p>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <button
                  type='button'
                  onClick={() => setType('email')}
                  className={cn(
                    'flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-8 text-left transition-all',
                    type === 'email'
                      ? 'border-brand bg-brand text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-brand/30'
                  )}
                >
                  <Mail className='h-8 w-8 shrink-0' aria-hidden />
                  <span className='text-lg font-bold'>Email</span>
                </button>
                <button
                  type='button'
                  onClick={() => setType('sms')}
                  className={cn(
                    'flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-8 text-left transition-all',
                    type === 'sms'
                      ? 'border-brand bg-brand text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-brand/30'
                  )}
                >
                  <MessageSquare className='h-8 w-8 shrink-0' aria-hidden />
                  <span className='text-lg font-bold'>SMS</span>
                </button>
              </div>
            </div>

            <div>
              <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Recipients
              </p>
              <div className='mb-4 inline-flex rounded-full bg-gray-100 p-1'>
                <button
                  type='button'
                  onClick={() => {
                    setTargetMode('audience')
                    setSendErr('')
                  }}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    targetMode === 'audience'
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  By Audience
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setTargetMode('single')
                    setSendErr('')
                  }}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    targetMode === 'single'
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  Single User
                </button>
              </div>

              {targetMode === 'audience' ? (
                <div>
                  <p className='mb-2 text-xs text-gray-500'>
                    Leave all unchecked to include every role. Select one or more
                    to narrow.
                  </p>
                  <div className='grid grid-cols-2 gap-2'>
                    {AUDIENCE_ROLE_OPTIONS.map(({ role, label }) => {
                      const checked = audienceRoles.includes(role)
                      return (
                        <button
                          key={role}
                          type='button'
                          onClick={() => toggleAudienceRole(role)}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
                            checked
                              ? 'border-brand bg-brand/10 font-semibold text-brand'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-brand/30'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                              checked
                                ? 'border-brand bg-brand text-white'
                                : 'border-gray-300 bg-white'
                            )}
                          >
                            {checked ? '✓' : ''}
                          </span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className='max-w-xl'>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Search by name or email
                  </label>
                  <div className='relative'>
                    <input
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value)
                        setShowUserPicker(true)
                      }}
                      onFocus={() => setShowUserPicker(true)}
                      placeholder='Start typing...'
                      className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
                    />
                    {showUserPicker ? (
                      <div className='absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg'>
                        {usersLoading ? (
                          <p className='px-3 py-2 text-sm text-gray-500'>
                            Loading users...
                          </p>
                        ) : filteredUsers.length === 0 ? (
                          <p className='px-3 py-2 text-sm text-gray-500'>
                            No users found.
                          </p>
                        ) : (
                          filteredUsers.slice(0, 60).map((u) => {
                            const name = displayRecipientLabel(u)
                            return (
                              <button
                                key={u.id}
                                type='button'
                                onClick={() => {
                                  setSelectedUser(u)
                                  setUserSearch(
                                    `${name} (${u.email ?? 'no email'})`
                                  )
                                  setShowUserPicker(false)
                                }}
                                className='w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50'
                              >
                                <p className='font-medium text-gray-800'>{name}</p>
                                <p className='text-xs text-gray-500'>{u.email}</p>
                              </button>
                            )
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                  {selectedUser ? (
                    <div className='mt-3 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/5 px-3 py-2 text-sm text-brand'>
                      <span>
                        {displayRecipientLabel(selectedUser)}
                        {selectedUser.email
                          ? ` (${selectedUser.email})`
                          : ''}
                      </span>
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedUser(null)
                          setUserSearch('')
                        }}
                        className='rounded-full p-0.5 font-bold hover:bg-brand/10'
                        aria-label='Remove'
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {type === 'email' ? (
              <div className='space-y-4'>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Subject
                  </label>
                  <input
                    name='subject'
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
                  />
                </div>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Message
                  </label>
                  <textarea
                    name='message'
                    required
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
                  />
                  <p className='mt-2 text-xs text-gray-500'>
                    Use placeholders: {'{{name}}'}, {'{{first_name}}'},{' '}
                    {'{{full_name}}'}, {'{{farm_name}}'}, {'{{role}}'},{' '}
                    {'{{email}}'}.
                  </p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {MESSAGE_MERGE_TAGS.map(({ token, label }) => (
                      <button
                        key={token}
                        type='button'
                        onClick={() => appendMergeAtCursor(token)}
                        className='rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-brand/40 hover:bg-brand/5 hover:text-brand'
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div>
                  <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Message
                  </label>
                  <textarea
                    ref={messageInputRef}
                    name='message'
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
                  />
                  <p className={cn('mt-1 text-sm font-semibold', smsCounterClass)}>
                    {smsCharCount} / 160
                  </p>
                  <p className='mt-1 text-xs text-gray-500'>
                    Over 160 characters sends as 2 SMS parts
                  </p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {SMS_MERGE_TAGS.map(({ token, label }) => (
                      <button
                        key={token}
                        type='button'
                        onClick={() => appendMergeAtCursor(token)}
                        className='rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-brand/40 hover:bg-brand/5 hover:text-brand'
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className='mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400'>
                    Preview with sample data
                  </p>
                  <div className='mx-auto w-64 rounded-3xl bg-gray-900 p-4'>
                    <div className='rounded-2xl bg-white px-3 py-2 text-sm text-gray-900 shadow'>
                      <p className='whitespace-pre-wrap break-words'>
                        {previewSmsBody(message) || 'Your message preview...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type='submit'
              disabled={
                sending ||
                audienceRecipientCount === 0 ||
                !message.trim() ||
                (type === 'email' && !subject.trim())
              }
              className='flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {sending ? (
                <>
                  <Loader2 className='h-5 w-5 animate-spin' aria-hidden />
                  Sending...
                </>
              ) : (
                <>
                  Send to ~{audienceRecipientCount} recipient
                  {audienceRecipientCount === 1 ? '' : 's'}
                </>
              )}
            </button>
          </form>
        ) : tab === 'logs' ? (
          <div className='mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white'>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead>
                  <tr className='border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400'>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3'>Recipients</th>
                    <th className='px-4 py-3'>Subject</th>
                    <th className='px-4 py-3'>Message</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3'>Count</th>
                    <th className='px-4 py-3'>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((k) => (
                        <RowSkeleton key={k} cols={7} />
                      ))}
                    </>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className='px-4 py-12 text-center text-gray-400'
                      >
                        No logs yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        role='button'
                        tabIndex={0}
                        onClick={() => setExpandedLog(log)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setExpandedLog(log)
                          }
                        }}
                        className='cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50'
                      >
                        <td className='px-4 py-3'>
                          <span className='inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-700'>
                            {log.type}
                          </span>
                        </td>
                        <td className='max-w-[160px] truncate px-4 py-3 text-gray-600'>
                          {log.recipients}
                        </td>
                        <td className='max-w-[200px] truncate px-4 py-3 text-gray-600'>
                          {log.subject ? truncate(log.subject, 48) : '-'}
                        </td>
                        <td className='max-w-[200px] px-4 py-3'>
                          <p className='truncate text-sm text-gray-700'>
                            {log.message ? truncate(log.message, 60) : '-'}
                          </p>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                              log.status === 'sent' || log.status === 'completed'
                                ? 'bg-green-50 text-green-700'
                                : log.status === 'failed'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-800'
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-gray-600'>
                          {log.success_count} / {log.recipient_count}
                        </td>
                        <td className='px-4 py-3 text-xs text-gray-400'>
                          {formatDate(log.created_at, 'dd MMM yyyy, HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className='mt-6 rounded-2xl border border-gray-100 bg-white p-5'>
            <div className='mb-4 flex flex-wrap gap-3'>
                  <select
                value={emailTypeFilter}
                onChange={(e) => setEmailTypeFilter(e.target.value)}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
              >
                <option value='all'>All Types</option>
                <option value='welcome'>welcome</option>
                <option value='application_received'>application_received</option>
                <option value='application_status'>application_status</option>
                <option value='placement_confirmed'>placement_confirmed</option>
                <option value='verification_approved'>verification_approved</option>
                <option value='bulk_sms'>bulk_sms</option>
                <option value='sms'>sms</option>
                  </select>
                  <select
                value={emailStatusFilter}
                onChange={(e) => setEmailStatusFilter(e.target.value)}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand'
              >
                <option value='all'>All</option>
                <option value='sent'>Sent</option>
                <option value='failed'>Failed</option>
                  </select>
                </div>

            <div className='mb-4 flex flex-wrap gap-4'>
              <div className='rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700'>
                Total sent:{' '}
                {
                  emailLogs.filter((x) => {
                    const okType =
                      emailTypeFilter === 'all' || x.type === emailTypeFilter
                    const okStatus =
                      emailStatusFilter === 'all' || x.status === emailStatusFilter
                    return okType && okStatus && x.status === 'sent'
                  }).length
                }
                  </div>
              <div className='rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600'>
                Total failed:{' '}
                {
                  emailLogs.filter((x) => {
                    const okType =
                      emailTypeFilter === 'all' || x.type === emailTypeFilter
                    const okStatus =
                      emailStatusFilter === 'all' || x.status === emailStatusFilter
                    return okType && okStatus && x.status === 'failed'
                  }).length
                }
                </div>
                </div>

            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead>
                  <tr className='border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400'>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3'>Recipient</th>
                    <th className='px-4 py-3'>Subject</th>
                    <th className='px-4 py-3'>Message</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3'>Sent At</th>
                    <th className='px-4 py-3'>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogsLoading ? (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((k) => (
                        <RowSkeleton key={k} cols={7} />
                      ))}
                    </>
                  ) : emailLogs.filter((x) => {
                      const okType =
                        emailTypeFilter === 'all' || x.type === emailTypeFilter
                      const okStatus =
                        emailStatusFilter === 'all' || x.status === emailStatusFilter
                      return okType && okStatus
                    }).length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className='px-4 py-12 text-center text-gray-400'
                      >
                        No email logs yet
                      </td>
                    </tr>
                  ) : (
                    emailLogs
                      .filter((x) => {
                        const okType =
                          emailTypeFilter === 'all' || x.type === emailTypeFilter
                        const okStatus =
                          emailStatusFilter === 'all' || x.status === emailStatusFilter
                        return okType && okStatus
                      })
                      .map((log) => {
                        const meta = log.metadata as Record<string, unknown>
                        const metaMsg =
                          typeof meta?.message === 'string' ? meta.message : ''
                        return (
                          <tr
                            key={log.id}
                            role='button'
                            tabIndex={0}
                            onClick={() => setExpandedEmailLog(log)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setExpandedEmailLog(log)
                              }
                            }}
                            className='cursor-pointer border-b border-gray-50 align-top transition-colors last:border-0 hover:bg-gray-50'
                          >
                            <td className='px-4 py-3'>
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                                  log.type === 'welcome'
                                    ? 'bg-blue-50 text-blue-700'
                                    : log.type === 'application_received'
                                      ? 'bg-purple-50 text-purple-700'
                                      : log.type === 'application_status'
                                        ? 'bg-amber-50 text-amber-700'
                                        : log.type === 'placement_confirmed'
                                          ? 'bg-green-50 text-green-700'
                                          : log.type === 'verification_approved'
                                            ? 'bg-brand/10 text-brand'
                                            : log.type === 'bulk_sms' ||
                                                log.type === 'sms'
                                              ? 'bg-teal-50 text-teal-800'
                                              : 'bg-gray-100 text-gray-600'
                                )}
                              >
                                {log.type}
                              </span>
                            </td>
                            <td className='px-4 py-3'>
                              <p className='text-sm text-gray-700'>
                                {log.recipient_name ?? log.recipient_email}
                              </p>
                              <p className='text-xs text-gray-400'>
                                {log.recipient_email}
                              </p>
                            </td>
                            <td className='px-4 py-3'>
                              <p className='max-w-[200px] truncate text-sm text-gray-700'>
                                {log.subject}
                              </p>
                            </td>
                            <td className='max-w-[200px] px-4 py-3'>
                              <p className='truncate text-sm text-gray-700'>
                                {log.subject || metaMsg || '-'}
                              </p>
                              {metaMsg ? (
                                <p className='mt-0.5 truncate text-xs text-gray-400'>
                                  {String(metaMsg).substring(0, 60)}
                                </p>
                              ) : null}
                            </td>
                            <td className='px-4 py-3'>
                              <StatusBadge status={log.status} />
                            </td>
                            <td className='px-4 py-3 text-xs text-gray-500'>
                              {formatDate(log.sent_at, 'dd MMM yyyy HH:mm')}
                            </td>
                            <td className='px-4 py-3'>
                              {log.status === 'failed' && log.error_message ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedEmailErrorId((prev) =>
                                        prev === log.id ? null : log.id
                                      )
                                    }}
                                    className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'
                                  >
                                    Error
                  </button>
                                  {expandedEmailErrorId === log.id ? (
                                    <p className='mt-2 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-700'>
                                      {log.error_message}
                                    </p>
                                  ) : null}
                </div>
                              ) : (
                                <span className='text-xs text-gray-400'>-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
              </div>
          </div>
        )}
      </div>
    </div>
  )
}
