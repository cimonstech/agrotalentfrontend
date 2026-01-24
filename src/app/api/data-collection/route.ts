import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/data-collection - Get data collection requests/jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const location = searchParams.get('location')
    
    // Data collection jobs are regular jobs with job_type = 'data_collector'
    let query = supabase
      .from('jobs')
      .select(`
        *,
        profiles:farm_id (
          id,
          farm_name,
          farm_type,
          farm_location
        )
      `)
      .eq('status', 'active')
      .eq('job_type', 'data_collector')
      .order('created_at', { ascending: false })
    
    if (location) {
      query = query.eq('location', location)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ jobs: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/data-collection - Create data collection request (Farm/Organization)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'farm') {
      return NextResponse.json(
        { error: 'Only employers/farms can create data collection requests' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      title,
      description,
      location,
      address,
      required_specialization,
      number_of_personnel,
      start_date,
      end_date,
      salary_per_person
    } = body
    
    // Create job with job_type = 'data_collector'
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        farm_id: user.id,
        title: title || 'Data Collection Project',
        description,
        job_type: 'data_collector',
        location,
        address,
        required_specialization,
        salary_min: salary_per_person,
        salary_max: salary_per_person,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ job }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
