import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function wrapEmailHtml(content: string) {
  const logoUrl =
    process.env.LOGO_URL ??
    'https://files.agrotalenthub.com/documents/agrotalent-logo.webp'

  return `
    <div style="font-family: Ubuntu, Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #ffffff; border: 1px solid #E5E7EB; padding: 22px 28px; border-radius: 12px 12px 0 0; display: flex; align-items: center; gap: 10px;">
        <img src="${logoUrl}" alt="AgroTalent Hub" width="36" height="36" style="border-radius: 999px; object-fit: cover; display: block;" />
        <h1 style="color: #0D3320; font-size: 20px; margin: 0; font-weight: 700;">AgroTalent Hub</h1>
      </div>
      <div style="padding: 32px; background: #F7F3EC; border: 1px solid #E5E7EB; border-top: 0; border-radius: 0 0 12px 12px;">
        ${content}
      </div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: #bbb; font-size: 11px; margin: 0;">AgroTalent Hub &bull; Accra, Ghana</p>
      </div>
    </div>
  `
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { user_id, type, status, job_title, review_notes } = await req.json()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: 'No email on profile' },
        { status: 400 }
      )
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    let subject = ''
    let html = ''

    if (type === 'verification_approved') {
      subject = 'Your AgroTalent Hub Account Has Been Verified'
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
      html = wrapEmailHtml(`
        <h2 style="color: #0D3320; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Account Verified!</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi ${profile.full_name ?? 'there'},<br><br>
          Great news! Your AgroTalent Hub account has been verified. You now have full access to all platform features.
        </p>
        <a href="${siteUrl}/dashboard"
           style="display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          Go to Dashboard
        </a>
      `)
    } else if (type === 'verification_revoked') {
      subject = 'Verification Status Updated'
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
      html = wrapEmailHtml(`
        <h2 style="color: #0D3320; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Verification Revoked</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi ${profile.full_name ?? 'there'},<br><br>
          Your account verification has been revoked by an administrator.
          Please review your profile details and required documents, then contact support if you need help restoring verification.
        </p>
        <a href="${siteUrl}/dashboard"
           style="display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          Open Dashboard
        </a>
      `)
    } else if (type === 'application_status') {
      subject = 'Application Status Updated - AgroTalent Hub'
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
      const label = String(status ?? 'updated')
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase())
      const notes = typeof review_notes === 'string' ? review_notes.trim() : ''
      html = wrapEmailHtml(`
        <h2 style="color: #0D3320; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Application Update</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi ${profile.full_name ?? 'there'},<br><br>
          The status of your application${job_title ? ` for <strong>${job_title}</strong>` : ''} has changed to <strong>${label}</strong>.
        </p>
        ${
          notes
            ? `
        <div style="margin: 0 0 24px; border-left: 4px solid #1A6B3C; background: #ffffff; padding: 12px 14px; border-radius: 8px;">
          <p style="margin: 0 0 6px; color: #0D3320; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Review note</p>
          <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.55; white-space: pre-wrap;">${notes
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</p>
        </div>`
            : ''
        }
        <a href="${siteUrl}/dashboard/graduate/applications"
           style="display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          View Applications
        </a>
      `)
    }

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Unsupported email notification type' },
        { status: 400 }
      )
    }

    const { error: sendError } = await resend.emails.send({
      from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
      to: profile.email,
      subject,
      html,
    })
    if (sendError) throw sendError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
