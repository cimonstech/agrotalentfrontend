import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type NotifyBody = {
  applicant_id?: string
  job_id?: string
  job_title?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are missing' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as NotifyBody
    const applicantId = body.applicant_id
    const jobId = body.job_id

    if (!applicantId) {
      return NextResponse.json({ error: 'applicant_id is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: applicantProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone, role')
      .eq('id', applicantId)
      .single()

    const roleMap: Record<string, string> = {
      graduate: 'graduate',
      student: 'student',
      skilled: 'skilled',
      farm: 'farm',
      admin: 'admin',
    }
    const dashRole = roleMap[applicantProfile?.role ?? 'graduate'] ?? 'graduate'
    const applicantDashPath = '/dashboard/' + dashRole + '/applications'

    let resolvedTitle = body.job_title ?? ''
    if (!resolvedTitle && jobId) {
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single()
      resolvedTitle = job?.title ?? ''
    }
    if (!resolvedTitle) {
      resolvedTitle = 'this job'
    }

    const { error: notifError } = await supabaseAdmin.from('notifications').insert({
      user_id: applicantId,
      type: 'application_received',
      title: 'Application Submitted',
      message: 'Your application for ' + resolvedTitle + ' has been submitted successfully.',
      read: false,
      link: applicantDashPath,
    })

    if (notifError) {
      console.error('Notification insert error:', notifError)
      return NextResponse.json({ error: notifError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Application notify route error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
