import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const jobId = params.id
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'

    const { data: job, error: jobErr } = await supabaseAdmin
      .from('jobs')
      .select('*, profiles!jobs_farm_id_fkey(farm_name, full_name)')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select(
        'id, match_score, status, profiles!applications_applicant_id_fkey(full_name, qualification, preferred_region, city)'
      )
      .eq('job_id', jobId)
      .order('match_score', { ascending: false })
      .limit(50)

    const totalApplicants = applications?.length ?? 0

    if (totalApplicants === 0) {
      return NextResponse.json(
        { error: 'No applications yet for this job' },
        { status: 400 }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')

    const { error: insertErr } = await supabaseAdmin
      .from('farm_preview_tokens')
      .insert({
        job_id: jobId,
        token,
        source_contact: job.source_contact,
        source_phone: job.source_phone,
        source_name: job.source_name,
        sent_at: new Date().toISOString(),
      })

    if (insertErr) {
      console.error('farm_preview_tokens insert:', insertErr)
      return NextResponse.json(
        { error: 'Failed to create preview link' },
        { status: 500 }
      )
    }

    const previewUrl = siteUrl + '/farm/preview/' + token

    const top3 = (applications ?? []).slice(0, 3).map((app, i) => {
      const profile = Array.isArray(app.profiles)
        ? app.profiles[0]
        : app.profiles
      const name = profile?.full_name ?? 'Candidate'
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
      return (
        i +
        1 +
        '. ' +
        initials +
        ' - ' +
        (profile?.qualification ?? 'N/A') +
        ' - ' +
        (profile?.city ?? profile?.preferred_region ?? 'N/A') +
        ' - Match: ' +
        (app.match_score ?? 0) +
        '%'
      )
    }).join('\n')

    const smsMessage =
      `Hello${job.source_name ? ' ' + job.source_name : ''},\n\n` +
      `You have ${totalApplicants} application${totalApplicants > 1 ? 's' : ''} for your "${job.title}" position on AgroTalent Hub.\n\n` +
      `Top candidates:\n${top3}\n\n` +
      `View all candidates: ${previewUrl}\n\n` +
      `Register free to contact candidates directly: ${siteUrl}/signup/farm`

    const emailHtml = `
      <div style="font-family: Ubuntu, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D3320; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; font-size: 20px; margin: 0; font-weight: 700;">AgroTalent Hub</h1>
        </div>
        <div style="padding: 32px; background: #F7F3EC; border-radius: 0 0 12px 12px;">
          <h2 style="color: #0D3320; font-size: 20px; font-weight: 700; margin: 0 0 12px;">
            You have ${totalApplicants} application${totalApplicants > 1 ? 's' : ''}!
          </h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            Hello${job.source_name ? ' ' + job.source_name : ''},
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Your job posting <strong>${job.title}</strong> on AgroTalent Hub has received
            <strong>${totalApplicants} application${totalApplicants > 1 ? 's' : ''}</strong>.
            Here is a preview of your top candidates:
          </p>

          ${(applications ?? [])
            .slice(0, 3)
            .map((app) => {
              const profile = Array.isArray(app.profiles)
                ? app.profiles[0]
                : app.profiles
              const name = profile?.full_name ?? 'Candidate'
              const initials = name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              return `
              <div style="background: white; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background: #1A6B3C; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0;">
                    ${initials}
                  </div>
                  <div>
                    <p style="margin: 0; font-weight: 700; color: #0D3320; font-size: 14px;">Candidate ${initials}</p>
                    <p style="margin: 2px 0 0; color: #6b7280; font-size: 12px;">
                      ${profile?.qualification ?? 'Qualification not specified'} &bull;
                      ${profile?.city ?? profile?.preferred_region ?? 'Location not specified'} &bull;
                      Match: <strong style="color: #1A6B3C;">${app.match_score ?? 0}%</strong>
                    </p>
                  </div>
                </div>
              </div>
            `
            })
            .join('')}

          <p style="color: #888; font-size: 13px; margin: 16px 0 24px;">
            ${totalApplicants > 3 ? `+ ${totalApplicants - 3} more candidate${totalApplicants - 3 > 1 ? 's' : ''}. ` : ''}
            Full candidate details are hidden to protect privacy.
          </p>

          <a href="${previewUrl}"
             style="display: inline-block; background: #1A6B3C; color: #fff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; margin-bottom: 16px;">
            View All Candidates
          </a>

          <div style="background: #C8963E15; border: 1px solid #C8963E30; border-radius: 10px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px; font-weight: 700; color: #0D3320; font-size: 14px;">
              Want to contact candidates directly?
            </p>
            <p style="margin: 0 0 12px; color: #555; font-size: 13px;">
              Register your farm free on AgroTalent Hub to see full candidate profiles,
              message candidates directly, and manage your hiring in one place.
            </p>
            <a href="${siteUrl}/signup/farm?ref=preview&job=${jobId}"
               style="display: inline-block; background: #C8963E; color: #fff; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
              Register Your Farm Free
            </a>
          </div>

          <p style="color: #aaa; font-size: 11px; margin: 24px 0 0;">
            This job was posted on AgroTalent Hub. If you did not authorize this posting, contact us at support@agrotalenthub.com
          </p>
        </div>
      </div>
    `

    const results: Record<string, string> = {}

    const notifyEmail =
      typeof job.source_email === 'string' && job.source_email.includes('@')
        ? job.source_email
        : typeof job.source_contact === 'string' &&
            job.source_contact.includes('@')
          ? job.source_contact
          : null

    if (notifyEmail) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        await resend.emails.send({
          from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
          to: notifyEmail,
          subject: `${totalApplicants} application${totalApplicants > 1 ? 's' : ''} for your ${job.title} position`,
          html: emailHtml,
        })
        results.email = 'sent to ' + notifyEmail
      } catch (emailErr) {
        results.email =
          'failed: ' +
          (emailErr instanceof Error ? emailErr.message : 'unknown')
      }
    }

    if (job.source_phone) {
      try {
        let phone = job.source_phone.replace(/[\s\-+()]/g, '')
        if (phone.startsWith('0')) phone = '233' + phone.slice(1)
        if (!phone.startsWith('233')) phone = '233' + phone

        const smsRes = await fetch('https://api.letsfish.africa/v1/sms', {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer ' +
              process.env.FISH_AFRICA_APP_ID +
              '.' +
              process.env.FISH_AFRICA_APP_SECRET,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: process.env.FISH_AFRICA_SENDER_ID ?? 'AgroTalentH',
            message: smsMessage,
            recipients: [phone],
          }),
        })
        if (!smsRes.ok) {
          results.sms = 'failed: HTTP ' + smsRes.status
        } else {
          results.sms = 'sent to ' + phone
        }
      } catch (smsErr) {
        results.sms =
          'failed: ' +
          (smsErr instanceof Error ? smsErr.message : 'unknown')
      }
    }

    const emailSent = results.email?.startsWith('sent') === true
    const smsSent = results.sms?.startsWith('sent') === true
    if (emailSent || smsSent) {
      const { error: reportErr } = await supabaseAdmin
        .from('jobs')
        .update({ report_sent_at: new Date().toISOString() })
        .eq('id', jobId)
      if (reportErr) {
        console.error('jobs report_sent_at update:', reportErr)
      }
    }

    return NextResponse.json({
      success: true,
      preview_url: previewUrl,
      total_applicants: totalApplicants,
      results,
    })
  } catch (err) {
    console.error('Send preview error:', err)
    return NextResponse.json(
      { error: 'Failed to send preview' },
      { status: 500 }
    )
  }
}
