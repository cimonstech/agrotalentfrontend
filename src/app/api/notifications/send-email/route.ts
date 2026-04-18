import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user_id, type } = await req.json()

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
      html = `
        <div style="font-family: Ubuntu, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0D3320; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;">AgroTalent Hub</h1>
          </div>
          <div style="padding: 32px; background: #F7F3EC; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0D3320; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Account Verified!</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${profile.full_name ?? 'there'},<br><br>
              Great news! Your AgroTalent Hub account has been verified. You now have full access to all platform features.
            </p>
            <a href="${siteUrl}/dashboard"
               style="display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
              Go to Dashboard
            </a>
          </div>
          <div style="text-align: center; padding: 20px;">
            <p style="color: #bbb; font-size: 11px; margin: 0;">AgroTalent Hub &bull; Accra, Ghana</p>
          </div>
        </div>
      `
    }

    if (subject && html) {
      await resend.emails.send({
        from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
        to: profile.email,
        subject,
        html,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
