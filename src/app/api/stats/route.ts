import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/stats - Get platform statistics (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get verified graduates count
    const { count: graduatesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'graduate')
      .eq('is_verified', true)
    
    // Get farms count
    const { count: farmsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'farm')
      .eq('is_verified', true)
    
    // Get active jobs count
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Get successful placements count
    const { count: placementsCount } = await supabase
      .from('placements')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'completed'])
    
    // Calculate placement rate (if we have applications)
    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
    
    const placementRate = totalApplications && totalApplications > 0
      ? Math.round((placementsCount || 0) / totalApplications * 100)
      : 0
    
    // Calculate average match time (days between application and placement)
    const { data: recentPlacements } = await supabase
      .from('placements')
      .select(`
        created_at,
        applications:application_id (
          created_at
        )
      `)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(10)
    
    let avgMatchTime = 7 // Default
    if (recentPlacements && recentPlacements.length > 0) {
      const times = recentPlacements
        .filter(p => p.applications?.created_at)
        .map(p => {
          const appDate = new Date(p.applications.created_at)
          const placementDate = new Date(p.created_at)
          return Math.ceil((placementDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24))
        })
      
      if (times.length > 0) {
        avgMatchTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      }
    }
    
    return NextResponse.json({
      stats: {
        verified_graduates: graduatesCount || 0,
        partner_farms: farmsCount || 0,
        active_jobs: jobsCount || 0,
        successful_placements: placementsCount || 0,
        placement_rate: placementRate,
        avg_match_time_days: avgMatchTime
      }
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
