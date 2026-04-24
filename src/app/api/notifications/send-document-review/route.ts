import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { logEmail } from '@/lib/logEmail'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  let recipientEmail = 'unknown'
  let recipientName = 'User'
  let subject = 'Document review update'
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (!adminProfile || String(adminProfile.role).toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { user_id, document_type, file_name, status, rejection_reason } = body as {
      user_id: string
      document_type: string
      file_name: string
      status: 'approved' | 'rejected'
      rejection_reason?: string | null
    }

    if (!user_id || !document_type || !file_name || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'Recipient profile not found' }, { status: 404 })
    }

    recipientEmail = profile.email
    recipientName = profile.full_name ?? 'User'
    subject = status === 'approved'
      ? 'Document Approved: ' + file_name
      : 'Document Update: ' + file_name

    const frontendUrl = (process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
    const profileUrl = frontendUrl + '/dashboard/graduate/profile'
    const uploadUrl = frontendUrl + '/dashboard/graduate/documents'
    const approved = status === 'approved'

    const html = `
      <div style='font-family: Ubuntu, Arial, sans-serif; max-width: 560px; margin: 0 auto;'>
        <div style='background: #0D3320; padding: 20px 24px; border-radius: 12px 12px 0 0;'>
          <h1 style='color: #fff; font-size: 20px; margin: 0; font-weight: 700;'>AgroTalent Hub</h1>
        </div>
        <div style='padding: 28px; background: #ffffff; border: 1px solid #E5E7EB; border-top: 0; border-radius: 0 0 12px 12px;'>
          <p style='color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 12px;'>Hi ${escapeHtml(recipientName)},</p>
          ${
            approved
              ? `<p style='color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 12px;'>Your ${escapeHtml(document_type)} document has been approved. Your profile verification is progressing.</p>
                 <p style='font-size: 22px; color: #16a34a; margin: 0 0 16px;'>✓</p>
                 <a href='${profileUrl}' style='display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 8px; text-decoration: none;'>View Profile</a>`
              : `<p style='color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 12px;'>Your ${escapeHtml(document_type)} document could not be approved.</p>
                 ${
                   rejection_reason
                     ? `<div style='margin: 0 0 12px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 8px; padding: 12px; color: #b91c1c; font-size: 14px;'>Reason: ${escapeHtml(rejection_reason)}</div>`
                     : ''
                 }
                 <p style='color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;'>Please upload a new document that meets the requirements.</p>
                 <a href='${uploadUrl}' style='display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 8px; text-decoration: none;'>Upload New Document</a>`
          }
        </div>
      </div>
    `

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({
      from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
      to: recipientEmail,
      subject,
      html,
    })
    if (sendError) throw sendError

    await logEmail({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      type: 'document_reviewed',
      status: 'sent',
      metadata: {
        user_id,
        document_type,
        file_name,
        status,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    await logEmail({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      type: 'document_reviewed',
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Failed to send document review email' }, { status: 500 })
  }
}
