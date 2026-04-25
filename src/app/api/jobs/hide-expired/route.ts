import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// CRON JOB SETUP
// To automatically hide and delete expired jobs, call this endpoint daily.
// Options:
// 1. Vercel Cron: add to vercel.json:
//    { 'crons': [{ 'path': '/api/jobs/hide-expired', 'schedule': '0 2 * * *' }] }
// 2. Supabase Edge Function: schedule a function that calls this URL daily
// 3. Manual: call POST /api/jobs/hide-expired from admin dashboard

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString()
    const sixtyDaysAgo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data: toHide } = await supabaseAdmin
      .from('jobs')
      .select('*, profiles!jobs_farm_id_fkey(email, full_name, phone, farm_name, role)')
      .lt('created_at', thirtyDaysAgo)
      .is('hidden_at', null)
      .is('deleted_at', null)
      .eq('status', 'active')

    for (const job of toHide ?? []) {
      await supabaseAdmin
        .from('jobs')
        .update({ hidden_at: new Date().toISOString(), status: 'paused' })
        .eq('id', job.id)

      const owner = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles
      if (owner && owner.role !== 'admin') {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'

        await resend.emails.send({
          from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
          to: owner.email,
          subject: 'Your job listing has been hidden: ' + job.title,
          html: `
            <div style='font-family: Ubuntu, sans-serif; max-width: 560px; margin: 0 auto;'>
              <div style='background: #0D3320; padding: 24px 32px; border-radius: 12px 12px 0 0;'>
                <h1 style='color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;'>AgroTalent Hub</h1>
              </div>
              <div style='padding: 32px; background: #F7F3EC; border-radius: 0 0 12px 12px;'>
                <h2 style='color: #0D3320; font-size: 20px; font-weight: 700; margin: 0 0 12px;'>Job Listing Hidden</h2>
                <p style='color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px;'>
                  Hi ${owner.full_name ?? owner.farm_name ?? 'there'},
                </p>
                <p style='color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px;'>
                  Your job listing <strong>${job.title}</strong> has been hidden from public view after 30 days. It will be permanently removed after 60 days if not reactivated.
                </p>
                <a href='${siteUrl}/dashboard/farm/jobs'
                   style='display: inline-block; background: #C8963E; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;'>
                  Reactivate Job
                </a>
                <p style='color: #999; font-size: 12px; margin: 24px 0 0;'>
                  You can reactivate this listing from your farm dashboard. Reactivated jobs stay active for another 30 days.
                </p>
              </div>
            </div>
          `,
        })

        if (owner.phone) {
          const phone = owner.phone.replace(/[\s\-\+]/g, '')
          const formattedPhone = phone.startsWith('0')
            ? '233' + phone.slice(1)
            : phone.startsWith('233')
              ? phone
              : '233' + phone

          await fetch('https://api.letsfish.africa/v1/sms/templates/send', {
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
              sender_id: process.env.FISH_AFRICA_SENDER_ID ?? 'AgroTalent',
              message:
                'Hi {{name}}, your job listing "{{job}}" has been hidden after 30 days. Log in to AgroTalent Hub to reactivate it before it is permanently removed.',
              recipients: [
                {
                  [formattedPhone]: {
                    name: owner.full_name ?? owner.farm_name ?? 'there',
                    job: job.title,
                  },
                },
              ],
            }),
          }).catch(console.error)
        }
      }
    }

    const { data: toDelete } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .lt('created_at', sixtyDaysAgo)
      .is('deleted_at', null)

    for (const job of toDelete ?? []) {
      await supabaseAdmin
        .from('jobs')
        .update({ deleted_at: new Date().toISOString(), status: 'closed' })
        .eq('id', job.id)
    }

    return NextResponse.json({
      success: true,
      hidden: toHide?.length ?? 0,
      deleted: toDelete?.length ?? 0,
    })
  } catch (err) {
    console.error('Hide expired jobs error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
