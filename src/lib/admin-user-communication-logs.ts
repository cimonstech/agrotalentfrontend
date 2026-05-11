import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommLogRow } from '@/components/dashboard/UserCommunicationHistoryCard'

const LIMIT = 80

function normalizeDigits(input: string | null | undefined): string[] {
  if (!input) return []
  const d = input.replace(/\D/g, '')
  if (d.length < 9) return []
  const variants = new Set<string>()
  variants.add(d)
  if (d.startsWith('233')) variants.add(d.slice(3))
  if (d.length === 10 && d.startsWith('0')) variants.add(d.slice(1))
  return Array.from(variants)
}

function mapEmailLogRow(row: {
  id: string
  recipient_email: string | null
  subject?: string | null
  type?: string | null
  status?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown> | null
  sent_at?: string | null
  created_at?: string | null
}): CommLogRow {
  const syntheticId = `email_log:${row.id}`
  const rawRecipient = String(row.recipient_email ?? '')
  const isSmsPseudo = /^sms:/i.test(rawRecipient)
  const phoneFromPseudo = isSmsPseudo ? rawRecipient.replace(/^sms:/i, '').trim() : null
  const meta =
    row.metadata && typeof row.metadata === 'object' ? row.metadata : null
  const metaPhone = typeof meta?.phone === 'string' ? meta.phone.trim() : null
  const typeStr = String(row.type ?? '').toLowerCase()
  const channel = typeStr === 'sms' || isSmsPseudo ? 'sms' : 'email'

  const parts: string[] = []
  if (row.subject?.trim()) parts.push(row.subject.trim())
  if (typeStr && !['email', 'sms'].includes(typeStr))
    parts.push(`Type: ${typeStr.replace(/_/g, ' ')}`)
  if (row.error_message?.trim()) parts.push(`Error: ${row.error_message.trim()}`)

  return {
    id: syntheticId,
    type: channel,
    channel,
    event_type: typeStr ? typeStr.replace(/_/g, ' ') : 'transactional',
    triggered_by: 'system',
    recipient_email: isSmsPseudo ? null : rawRecipient || null,
    recipient_phone: metaPhone || phoneFromPseudo,
    subject: row.subject ?? null,
    message: parts.join(' · ') || 'Transactional message',
    status: row.status ?? null,
    created_at: row.sent_at ?? row.created_at ?? null,
  }
}

/**
 * Loads communication + delivery logs for an applicant/admin-visible profile using the
 * browser Supabase session (admin RLS). Same sources as the backend `for-user` API but
 * avoids production failures when the Express proxy or Bearer forwarding breaks.
 */
export async function fetchAdminUserCommunicationLogsClient(
  supabase: SupabaseClient,
  profile: { id: string; email?: string | null; phone?: string | null }
): Promise<CommLogRow[]> {
  const collected = new Map<string, CommLogRow>()
  const addRows = (rows: CommLogRow[] | null | undefined) => {
    for (const r of rows ?? []) {
      const rid = r?.id
      if (rid) collected.set(rid, r)
    }
  }

  const { data: byUser, error: errUser } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('related_user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(LIMIT)

  if (!errUser && byUser) addRows(byUser as CommLogRow[])

  const email = profile.email?.trim().toLowerCase()
  if (email) {
    const { data: byEmail, error: errEmail } = await supabase
      .from('communication_logs')
      .select('*')
      .ilike('recipient_email', `%${email}%`)
      .order('created_at', { ascending: false })
      .limit(LIMIT)

    if (!errEmail && byEmail) addRows(byEmail as CommLogRow[])

    const elRes = await supabase
      .from('email_logs')
      .select('*')
      .ilike('recipient_email', `%${email}%`)
      .order('sent_at', { ascending: false })
      .limit(LIMIT)

    if (!elRes.error && elRes.data) {
      addRows(elRes.data.map(mapEmailLogRow))
    }
  }

  for (const digits of normalizeDigits(profile.phone)) {
    const { data: byPhone, error: errPhone } = await supabase
      .from('communication_logs')
      .select('*')
      .ilike('recipient_phone', `%${digits}%`)
      .order('created_at', { ascending: false })
      .limit(LIMIT)

    if (!errPhone && byPhone) addRows(byPhone as CommLogRow[])

    const smsElRes = await supabase
      .from('email_logs')
      .select('*')
      .ilike('recipient_email', `%sms:${digits}%`)
      .order('sent_at', { ascending: false })
      .limit(LIMIT)

    if (!smsElRes.error && smsElRes.data) {
      addRows(smsElRes.data.map(mapEmailLogRow))
    }
  }

  const merged = Array.from(collected.values())
  merged.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  return merged.slice(0, LIMIT)
}
