import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateMatchScore } from '@/lib/matchScore'
import type { Job, Profile } from '@/types'

type RecalcJob = Pick<
  Job,
  | 'location'
  | 'city'
  | 'required_specialization'
  | 'required_qualification'
  | 'required_experience_years'
  | 'required_institution_type'
>

type RecalcProfile = Pick<
  Profile,
  | 'preferred_region'
  | 'city'
  | 'preferred_regions'
  | 'preferred_cities'
  | 'specialization'
  | 'qualification'
  | 'years_of_experience'
  | 'institution_type'
>

type RecalcApp = {
  id: string
  jobs: RecalcJob | RecalcJob[] | null
  profiles: RecalcProfile | RecalcProfile[] | null
}

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        jobs:job_id (
          location,
          city,
          required_specialization,
          required_qualification,
          required_experience_years,
          required_institution_type
        ),
        profiles:applicant_id (
          preferred_region,
          city,
          preferred_regions,
          preferred_cities,
          specialization,
          qualification,
          years_of_experience,
          institution_type
        )
      `)

    if (!applications) {
      return NextResponse.json({ success: false, error: 'No applications found' })
    }

    let updated = 0

    for (const app of applications as RecalcApp[]) {
      const jobRow = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
      const profileRow = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles

      if (!jobRow || !profileRow) continue

      const job = {
        ...jobRow,
        location: jobRow.location ?? '',
      } as Job

      const profile = profileRow as Profile

      const score = calculateMatchScore(profile, job)

      await supabaseAdmin
        .from('applications')
        .update({ match_score: score })
        .eq('id', app.id)

      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('Recalculate error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
