'use client'

import { Card } from '@/components/ui/Card'
import { cn, formatDate } from '@/lib/utils'

export type CommLogRow = {
  id?: string
  type?: string | null
  channel?: string | null
  event_type?: string | null
  triggered_by?: string | null
  recipient_email?: string | null
  recipient_phone?: string | null
  subject?: string | null
  message?: string | null
  status?: string | null
  created_at?: string | null
}

function channelLabel(row: CommLogRow): string {
  const ch = String(row.channel ?? row.type ?? '').toLowerCase()
  if (ch === 'sms') return 'SMS'
  if (ch === 'email') return 'Email'
  return ch ? ch : 'Message'
}

/** How the message was sent (platform automation vs admin Communications tool). */
function sourceLabel(row: CommLogRow): string {
  if (row.event_type === 'admin_manual') return 'Manual · admin'
  const trig = String(row.triggered_by ?? '').toLowerCase()
  if (trig === 'system') return 'Automated'
  if (trig === 'admin') return 'Admin'
  if (trig === 'cron') return 'Scheduled'
  return trig ? trig : 'Notification'
}

function excerpt(text: string | null | undefined, max = 220): string {
  if (!text?.trim()) return ''
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

const LOG_DATETIME_PATTERN = 'dd MMM yyyy, HH:mm'

export function UserCommunicationHistoryCard({
  title = 'Communication history',
  description =
    'Automated SMS or email from the platform (notifications, applications, etc.) plus manual messages sent by administrators.',
  logs,
  loading,
  className,
}: {
  title?: string
  description?: string
  logs: CommLogRow[]
  loading?: boolean
  className?: string
}) {
  return (
    <Card className={cn('p-5', className)}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading history…</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No SMS or email activity logged for this account yet.
        </p>
      ) : (
        <div className="mt-4 max-h-96 min-h-0 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id ?? `${log.created_at}-${log.recipient_email}-${log.recipient_phone}`}
              className="rounded-xl border border-gray-100 bg-gray-50/90 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                  {channelLabel(log)}
                </span>
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                  {sourceLabel(log)}
                </span>
                <span
                  className="ml-auto shrink-0 whitespace-nowrap text-xs tabular-nums text-gray-400"
                  title={log.created_at ?? undefined}
                >
                  {log.created_at
                    ? formatDate(log.created_at, LOG_DATETIME_PATTERN)
                    : ''}
                </span>
              </div>
              {log.event_type?.trim() ? (
                <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">
                  {log.event_type.trim().replace(/_/g, ' ')}
                </p>
              ) : null}
              {log.subject?.trim() ? (
                <p className="mt-2 font-medium text-gray-900">{log.subject.trim()}</p>
              ) : null}
              <p className="mt-1 text-gray-600">{excerpt(log.message)}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {log.recipient_email?.trim() ? (
                  <span>To: {log.recipient_email.trim()}</span>
                ) : null}
                {log.recipient_phone?.trim() ? (
                  <span>To: {log.recipient_phone.trim()}</span>
                ) : null}
                {log.status ? (
                  <span className="capitalize">Status: {log.status}</span>
                ) : null}
              </div>
            </li>
          ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
