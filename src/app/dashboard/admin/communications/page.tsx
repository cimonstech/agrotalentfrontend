'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import type { CommunicationLog, EmailLog, Profile, UserRole } from '@/types'
import { cn, formatDate, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Pill } from '@/components/ui/Badge'
import { formatCurrency, ROLE_LABELS, timeAgo } from '@/lib/utils'
import Image from 'next/image'

const supabase = createSupabaseClient()

type Tab = 'send' | 'logs' | 'email_logs'
type TargetMode = 'audience' | 'single'

type RecipientUser = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'phone' | 'role'
>

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All users' },
  { value: 'farm', label: 'Farm' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'student', label: 'Student' },
  { value: 'skilled', label: 'Skilled' },
  { value: 'custom', label: 'Custom' },
]

function RowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-50">
      {[0, 1, 2, 3, 4, 5].map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminCommunicationsPage() {
  const [tab, setTab] = useState<Tab>('send')
  const [type, setType] = useState('email')
  const [targetMode, setTargetMode] = useState<TargetMode>('audience')
  const [audience, setAudience] = useState('all')
  const [customRecipients, setCustomRecipients] = useState('')
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

  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [emailLogsLoading, setEmailLogsLoading] = useState(false)
  const [emailTypeFilter, setEmailTypeFilter] = useState('all')
  const [emailStatusFilter, setEmailStatusFilter] = useState('all')
  const [expandedEmailErrorId, setExpandedEmailErrorId] = useState<string | null>(null)

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

  useEffect(() => {
    if (tab === 'logs') void loadLogs()
  }, [tab, loadLogs])

  useEffect(() => {
    if (tab !== 'email_logs') return
    let cancelled = false
    ;(async () => {
      setEmailLogsLoading(true)
      try {
        const { data } = await supabase
          .from('email_logs')
          .select('*')
          .order('sent_at', { ascending: false })
          .limit(100)
        if (!cancelled) setEmailLogs((data as EmailLog[]) ?? [])
      } finally {
        if (!cancelled) setEmailLogsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tab])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setUsersLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
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
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').toLowerCase().includes(q) ||
      (u.role ?? '').toLowerCase().includes(q)
    )
  })

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
    if (
      targetMode === 'audience' &&
      audience === 'custom' &&
      !customRecipients.trim()
    ) {
      setSendErr('Add at least one recipient email.')
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
    setSending(true)
    try {
      const audienceToApi: Record<
        string,
        | 'all'
        | 'farms'
        | 'graduates'
        | 'students'
        | 'skilled'
        | 'custom'
      > = {
        all: 'all',
        farm: 'farms',
        graduate: 'graduates',
        student: 'students',
        skilled: 'skilled',
        custom: 'custom',
      }
      const recipients =
        targetMode === 'single'
          ? 'single'
          : audienceToApi[audience] ?? 'all'
      const res = (await apiClient.sendCommunication({
        type: type as 'email' | 'sms',
        recipients,
        subject: type === 'email' ? subject.trim() : undefined,
        message: message.trim(),
        userId: targetMode === 'single' ? selectedUser?.id : undefined,
        customRecipients:
          targetMode === 'audience' && audience === 'custom'
            ? customRecipients.trim()
            : undefined,
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
    setCustomRecipients('')
    setSelectedUser(null)
    setUserSearch('')
    setShowUserPicker(false)
    void loadLogs()
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <DashboardPageHeader
          greeting='Communications'
          subtitle='Send messages and view logs'
        />

        <div className="mt-6 flex gap-6 border-b border-gray-200">
          <button
            type="button"
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
            type="button"
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
            type="button"
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

        {tab === 'send' ? (
          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-6"
          >
            {sendErr ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sendErr}
              </p>
            ) : null}
            {sendOk ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                {sendOk}
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">Type</p>
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setType('email')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    type === 'email'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setType('sms')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    type === 'sms'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  SMS
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">Recipients</p>
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('audience')
                    setSendErr('')
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    targetMode === 'audience'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  By audience
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode('single')
                    setSendErr('')
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    targetMode === 'single'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  Single user
                </button>
              </div>
            </div>

            {targetMode === 'audience' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full max-w-md rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="max-w-xl">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Select user
                </label>
                <div className="relative">
                  <input
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      setShowUserPicker(true)
                    }}
                    onFocus={() => setShowUserPicker(true)}
                    placeholder="Search by name, email, phone, or role"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  {showUserPicker ? (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                      {usersLoading ? (
                        <p className="px-3 py-2 text-sm text-gray-500">
                          Loading users...
                        </p>
                      ) : filteredUsers.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-500">
                          No users found.
                        </p>
                      ) : (
                        filteredUsers.slice(0, 60).map((u) => {
                          const name = u.full_name ?? 'Unnamed'
                          const role = (u.role as UserRole | null) ?? null
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u)
                                setUserSearch(
                                  `${name} (${u.email ?? u.phone ?? 'no contact'})`
                                )
                                setShowUserPicker(false)
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <p className="font-medium text-gray-800">{name}</p>
                              <p className="text-xs text-gray-500">
                                {u.email ?? 'no email'} {u.phone ? ` · ${u.phone}` : ''}
                                {role ? ` · ${role}` : ''}
                              </p>
                            </button>
                          )
                        })
                      )}
                    </div>
                  ) : null}
                </div>
                {selectedUser ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs text-brand">
                    <span>
                      Selected:{' '}
                      {selectedUser.full_name ?? selectedUser.email ?? selectedUser.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null)
                        setUserSearch('')
                      }}
                      className="font-bold text-brand hover:text-forest"
                    >
                      x
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {targetMode === 'audience' && audience === 'custom' ? (
              <Textarea
                label="Custom recipients (comma separated)"
                name="customRecipients"
                value={customRecipients}
                onChange={(e) => setCustomRecipients(e.target.value)}
                rows={3}
              />
            ) : null}

            {type === 'email' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Subject
                </label>
                <input
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            ) : null}

            <Textarea
              label="Message"
              name="message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />

            <Button
              type="submit"
              className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:opacity-95"
              loading={sending}
            >
              Send
            </Button>
          </form>
        ) : tab === 'logs' ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((k) => (
                        <RowSkeleton key={k} />
                      ))}
                    </>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        No logs yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-700">
                            {log.type}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-gray-600">
                          {log.recipients}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                          {log.subject ? truncate(log.subject, 48) : '-'}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 text-gray-600">
                          {log.success_count} / {log.recipient_count}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
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
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap gap-3">
              <select
                value={emailTypeFilter}
                onChange={(e) => setEmailTypeFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="all">All Types</option>
                <option value="welcome">welcome</option>
                <option value="application_received">application_received</option>
                <option value="application_status">application_status</option>
                <option value="placement_confirmed">placement_confirmed</option>
                <option value="verification_approved">verification_approved</option>
              </select>
              <select
                value={emailStatusFilter}
                onChange={(e) => setEmailStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="mb-4 flex flex-wrap gap-4">
              <div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
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
              <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
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

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent At</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogsLoading ? (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((k) => (
                        <RowSkeleton key={k} />
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
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-400"
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
                      .map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-50 align-top transition-colors last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
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
                                          : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700">
                              {log.recipient_name ?? log.recipient_email}
                            </p>
                            <p className="text-xs text-gray-400">
                              {log.recipient_email}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-[200px] truncate text-sm text-gray-700">
                              {log.subject}
                            </p>
                            {log.metadata &&
                            typeof log.metadata === 'object' &&
                            Object.keys(log.metadata).length > 0 ? (
                              <p className="mt-1 text-xs text-gray-400">
                                {Object.entries(log.metadata)
                                  .map(([k, v]) => `${k}: ${String(v)}`)
                                  .join(' | ')}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {formatDate(log.sent_at, 'dd MMM yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3">
                            {log.status === 'failed' && log.error_message ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedEmailErrorId((prev) =>
                                      prev === log.id ? null : log.id
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                                >
                                  Error
                                </button>
                                {expandedEmailErrorId === log.id ? (
                                  <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-700">
                                    {log.error_message}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
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
