import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ROLES = new Set(['farm', 'graduate', 'student', 'skilled'])

function formatPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-+()]/g, '')
  if (cleaned.length < 9) return null
  if (cleaned.startsWith('0')) return '233' + cleaned.slice(1)
  if (cleaned.startsWith('233')) return cleaned
  return '233' + cleaned
}

async function sendBatch(
  phones: string[],
  message: string,
  senderId: string
): Promise<{ sent: number; failed: number }> {
  try {
    const appId = process.env.FISH_AFRICA_APP_ID ?? ''
    const secret = process.env.FISH_AFRICA_APP_SECRET ?? ''
    if (!appId || !secret) {
      return { sent: 0, failed: phones.length }
    }
    const token = appId + '.' + secret
    const signal =
      typeof AbortSignal !== 'undefined' &&
      typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(30000)
        : undefined

    const res = await fetch('https://api.letsfish.africa/v1/sms', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        message,
        recipients: phones,
      }),
      ...(signal ? { signal } : {}),
    })

    if (!res.ok) return { sent: 0, failed: phones.length }
    const data = (await res.json()) as { data?: { status?: string }[] }
    const sent = (data.data ?? []).filter(
      (d) => d.status === 'queued' || d.status === 'sent'
    ).length
    return { sent, failed: phones.length - sent }
  } catch {
    return { sent: 0, failed: phones.length }
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role =
      (user.app_metadata as Record<string, unknown> | undefined)?.role ??
      (user.user_metadata as Record<string, unknown> | undefined)?.role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as {
      message?: string
      roles?: string[]
      batch_size?: number
    }
    const { message, roles: rolesRaw, batch_size: batchSizeRaw } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const roles = (Array.isArray(rolesRaw) ? rolesRaw : []).filter(
      (r): r is string => typeof r === 'string' && ALLOWED_ROLES.has(r)
    )
    if (roles.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid role is required' },
        { status: 400 }
      )
    }

    let batchSize =
      typeof batchSizeRaw === 'number' && Number.isFinite(batchSizeRaw)
        ? Math.floor(batchSizeRaw)
        : 20
    batchSize = Math.min(100, Math.max(1, batchSize))

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles, error: qErr } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, role')
      .in('role', roles)
      .not('phone', 'is', null)

    if (qErr) {
      console.error('Bulk SMS profile query:', qErr)
      return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
    }

    const seen = new Set<string>()
    const phones: string[] = []
    for (const p of profiles ?? []) {
      const raw = p.phone as string | null
      if (!raw || !String(raw).trim()) continue
      const f = formatPhone(String(raw).trim())
      if (f && !seen.has(f)) {
        seen.add(f)
        phones.push(f)
      }
    }

    if (phones.length === 0) {
      return NextResponse.json(
        { error: 'No valid phone numbers found' },
        { status: 400 }
      )
    }

    const senderId = process.env.FISH_AFRICA_SENDER_ID ?? 'AgroTalentH'
    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < phones.length; i += batchSize) {
      const batch = phones.slice(i, i + batchSize)
      const { sent, failed } = await sendBatch(batch, message.trim(), senderId)
      totalSent += sent
      totalFailed += failed

      if (i + batchSize < phones.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    try {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: 'sms:bulk:' + roles.join(','),
        recipient_name: null,
        subject: 'Bulk SMS',
        type: 'bulk_sms',
        status: totalSent > 0 ? 'sent' : 'failed',
        error_message: null,
        sent_at: new Date().toISOString(),
        metadata: {
          roles,
          total: phones.length,
          sent: totalSent,
          failed: totalFailed,
          message: message.trim().substring(0, 100),
        },
      })
    } catch (logErr) {
      console.error('Bulk SMS log insert:', logErr)
    }

    return NextResponse.json({
      success: true,
      total: phones.length,
      sent: totalSent,
      failed: totalFailed,
    })
  } catch (err) {
    console.error('Bulk SMS error:', err)
    return NextResponse.json({ error: 'Failed to send bulk SMS' }, { status: 500 })
  }
}
