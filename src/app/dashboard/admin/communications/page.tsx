'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { CommunicationLog } from '@/types'
import { cn, formatDate, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

type Tab = 'send' | 'logs'

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
  const [audience, setAudience] = useState('all')
  const [customRecipients, setCustomRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendOk, setSendOk] = useState('')
  const [sendErr, setSendErr] = useState('')

  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

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
    if (audience === 'custom' && !customRecipients.trim()) {
      setSendErr('Add at least one recipient email.')
      return
    }
    setSending(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setSendErr('You must be signed in.')
      setSending(false)
      return
    }
    const recipients =
      audience === 'custom' ? customRecipients.trim() : audience
    const { error } = await supabase.from('communication_logs').insert({
      type,
      recipients,
      subject: subject.trim() || null,
      message: message.trim(),
      recipient_count: 0,
      success_count: 0,
      failure_count: 0,
      status: 'sending',
      created_by: uid,
    })
    setSending(false)
    if (error) {
      setSendErr(error.message)
      return
    }
    setSendOk('Message queued for sending.')
    setSubject('')
    setMessage('')
    setCustomRecipients('')
    void loadLogs()
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>

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

            {audience === 'custom' ? (
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
        ) : (
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
        )}
      </div>
    </div>
  )
}
