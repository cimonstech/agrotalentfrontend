import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, application_cv_url, applicant_id, job_id')
      .eq('id', params.id)
      .maybeSingle()

    if (appError || !application || !application.application_cv_url) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    const r2Response = await fetch(application.application_cv_url)
    if (!r2Response.ok) {
      return NextResponse.json(
        { error: 'Could not fetch CV' },
        { status: 502 }
      )
    }

    const contentType =
      r2Response.headers.get('content-type') ?? 'application/pdf'
    const buffer = await r2Response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
      },
    })
  } catch (err) {
    console.error('Application CV error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
