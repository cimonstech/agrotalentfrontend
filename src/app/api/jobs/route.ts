import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/jobs - List all active jobs (with optional filters) or get single job
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    
    const jobId = searchParams.get('id')
    const { data: { user } } = await supabase.auth.getUser()
    
    // If ID provided, return single job (same visibility as list: active or recently inactive)
    if (jobId) {
      const baseSelect = `
        *,
        profiles:farm_id (
          id,
          farm_name,
          farm_type,
          farm_location
        )
      `
      // Use service role when available so we can return jobs that are on the list
      // (RLS often allows only 'active' for anon; list shows active + inactive < 24h)
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const useServiceRole = !!url && !!serviceKey
      const client = useServiceRole ? createClient(url, serviceKey) : supabase

      const { data, error } = await client
        .from('jobs')
        .select(baseSelect)
        .eq('id', jobId)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      
      // Hide inactive jobs older than 24h (same rule as list)
      if (data.status === 'inactive' && data.status_changed_at) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(data.status_changed_at) <= twentyFourHoursAgo) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }
      }
      
      return NextResponse.json({ job: data }, { status: 200 })
    }
    
    // Otherwise, return list of jobs with filters
    const location = searchParams.get('location')
    const jobType = searchParams.get('job_type')
    const specialization = searchParams.get('specialization')
    const farmId = searchParams.get('farm_id')
    const status = searchParams.get('status') || 'all'
    
    // If status='all', we need service role to bypass RLS (RLS only allows 'active' for anon).
    // On live, set SUPABASE_SERVICE_ROLE_KEY in server env; if missing we use anon to avoid 500.
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const useServiceRole = status === 'all' && !user && !!url && !!serviceKey
    const supabaseForQuery = useServiceRole
      ? createClient(url, serviceKey)
      : supabase
    
    const baseSelect = user || status === 'all'
      ? `
        *,
        profiles:farm_id (
          id,
          farm_name,
          farm_type,
          farm_location
        )
      `
      : `*`

    let query = supabaseForQuery
      .from('jobs')
      .select(baseSelect)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    // Note: For 'all' status, we'll filter inactive jobs older than 24h after fetching
    
    if (location) {
      query = query.eq('location', location)
    }
    
    if (jobType) {
      query = query.eq('job_type', jobType)
    }
    
    if (specialization) {
      query = query.eq('required_specialization', specialization)
    }
    
    if (farmId) {
      query = query.eq('farm_id', farmId)
    }
    
    let { data, error } = await query
    
    if (error) throw error
    
    // Filter out inactive jobs older than 24 hours for public view
    if (status === 'all' || !status) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      data = (data || []).filter((job: any) => {
        // Show job if:
        // 1. Status is not 'inactive', OR
        // 2. Status is 'inactive' but status_changed_at is within last 24 hours (or null)
        if (job.status !== 'inactive') return true
        if (!job.status_changed_at) return true // Show if no status_changed_at (backward compatibility)
        const statusChangedAt = new Date(job.status_changed_at)
        return statusChangedAt > twentyFourHoursAgo
      })
    }
    
    const res = NextResponse.json({ jobs: data }, { status: 200 })
    // Short cache for list (no ?id) so repeat visits and home prefetch are faster
    if (!jobId) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    }
    return res
  } catch (error: any) {
    const message = error?.message ?? 'Failed to fetch jobs'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job (Farm only)
export async function POST(request: NextRequest) {
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
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is an employer/farm or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, farm_name')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'farm' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only employers/farms and admins can post jobs' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      title,
      description,
      responsibilities,
      requirements,
      job_type,
      location,
      address,
      salary_min,
      salary_max,
      required_qualification,
      required_institution_type,
      required_experience_years,
      required_specialization,
      expires_at
    } = body
    
    // Create job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        farm_id: user.id,
        title,
        description,
        responsibilities: responsibilities ?? null,
        requirements: requirements ?? null,
        job_type,
        location,
        address,
        salary_min,
        salary_max,
        required_qualification,
        required_institution_type,
        required_experience_years,
        required_specialization,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw error
    
    void (async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: candidates } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, preferred_region, specialization, role')
          .in('role', ['graduate', 'student', 'skilled'])
          .eq('is_verified', true)

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
        const newJob = job
        const matches = (candidates ?? []).filter((candidate: any) => {
          const regionMatch = candidate.preferred_region === newJob.location
          const specMatch = newJob.required_specialization
            ? candidate.specialization === newJob.required_specialization
            : false
          return regionMatch || specMatch
        })
        const toNotify = matches.slice(0, 50)
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)

        for (const candidate of toNotify) {
          const dashboardPath = '/dashboard/' + candidate.role + '/jobs/' + newJob.id
          void (async () => {
            try {
              await supabaseAdmin.from('notifications').insert({
                user_id: candidate.id,
                type: 'new_job',
                title: 'New Job Match',
                message:
                  'A new ' +
                  newJob.title +
                  ' position is available in ' +
                  newJob.location +
                  ' that matches your profile.',
                link: dashboardPath,
                read: false,
              })
            } catch (notificationError) {
              console.error(notificationError)
            }
          })()

          void resend.emails
            .send({
              from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
              to: candidate.email,
              subject: 'New Job Match: ' + newJob.title,
              html: `
                <div style='font-family: Ubuntu, sans-serif; max-width: 560px; margin: 0 auto;'>
                  <div style='background: #0D3320; padding: 24px 32px; border-radius: 12px 12px 0 0;'>
                    <h1 style='color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;'>AgroTalent Hub</h1>
                  </div>
                  <div style='padding: 32px; background: #F7F3EC; border-radius: 0 0 12px 12px;'>
                    <h2 style='color: #0D3320; font-size: 20px; font-weight: 700; margin: 0 0 12px;'>New Job Match</h2>
                    <p style='color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 8px;'>Hi ${candidate.full_name ?? 'there'},</p>
                    <p style='color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;'>A new agricultural position matching your profile is now available.</p>
                    <div style='background: white; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                      <p style='font-weight: 700; color: #0D3320; margin: 0 0 4px;'>${newJob.title}</p>
                      <p style='color: #888; font-size: 13px; margin: 0;'>${newJob.location}</p>
                    </div>
                    <a href='${siteUrl + dashboardPath}' style='display: inline-block; background: #1A6B3C; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;'>View and Apply</a>
                    <p style='color: #999; font-size: 11px; margin: 24px 0 0;'>Matched based on your region and specialization preferences.</p>
                  </div>
                </div>
              `,
            })
            .catch(console.error)
        }
      } catch (err) {
        console.error('Job match notification error:', err)
      }
    })()
    
    return NextResponse.json({ job }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
