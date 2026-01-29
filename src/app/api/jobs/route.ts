import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/jobs - List all active jobs (with optional filters) or get single job
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const jobId = searchParams.get('id')
    const { data: { user } } = await supabase.auth.getUser()
    
    // If ID provided, return single job
    if (jobId) {
      const baseSelect = user
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

      const { data, error } = await supabase
        .from('jobs')
        .select(baseSelect)
        .eq('id', jobId)
        .single()
      
      if (error) throw error
      
      if (!data) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
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
    
    return NextResponse.json({ jobs: data }, { status: 200 })
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
    const supabase = createRouteHandlerClient({ cookies })
    
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
    
    // Create notification for matching graduates (automated)
    // This will be handled by a background job or trigger
    
    return NextResponse.json({ job }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
