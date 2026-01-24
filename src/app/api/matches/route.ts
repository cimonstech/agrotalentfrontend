import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
// Matching service will be implemented inline or moved to lib/services
// For now, using direct Supabase queries

// GET /api/matches - Get job matches for current user or matches for a job
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const jobId = searchParams.get('job_id')
    const applicantId = searchParams.get('applicant_id')
    
    if (jobId) {
      // Get matching graduates for a job (Farm view)
      // Use the match_score from applications table (calculated by database trigger)
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          applicant_id,
          match_score,
          applicant:applicant_id (
            id,
            full_name,
            qualification,
            preferred_region,
            is_verified
          )
        `)
        .eq('job_id', jobId)
        .order('match_score', { ascending: false })
      
      const matches = applications?.map(app => ({
        applicant_id: app.applicant_id,
        job_id: jobId,
        match_score: app.match_score || 0,
        applicant: app.applicant
      })) || []
      
      return NextResponse.json({ matches }, { status: 200 })
    } else {
      // Get matching jobs for current user (Graduate view)
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_region, specialization, institution_type, qualification, is_verified')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
      
      // Find jobs matching user's criteria
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
      
      // Location-based matching (regional placement)
      if (profile.preferred_region) {
        query = query.eq('location', profile.preferred_region)
      }
      
      const { data: jobs } = await query
      
      // Calculate match scores
      const matches = jobs?.map(job => {
        let score = 0
        if (job.location === profile.preferred_region) score += 50
        if (profile.is_verified) score += 20
        if (job.required_specialization === profile.specialization) score += 15
        if (job.required_institution_type === profile.institution_type || job.required_institution_type === 'any') score += 10
        
        return {
          applicant_id: user.id,
          job_id: job.id,
          match_score: Math.min(score, 100),
          job
        }
      }).filter(m => m.match_score >= 30)
        .sort((a, b) => b.match_score - a.match_score) || []
      
      return NextResponse.json({ matches }, { status: 200 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
