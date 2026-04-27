import { getLocationScore } from './locations'
import type { Profile, Job } from '@/types'

export function calculateMatchScore(profile: Profile, job: Job): number {
  let score = 0
  let totalPossible = 0

  totalPossible += 40
  const locationScore = getLocationScore(
    profile.preferred_region ?? null,
    profile.city ?? null,
    profile.preferred_regions ?? null,
    profile.preferred_cities ?? null,
    job.location ?? null,
    job.city ?? null,
    job.acceptable_regions ?? null,
    job.acceptable_cities ?? null
  )
  score += Math.round(locationScore * 40)

  if (job.required_specialization) {
    totalPossible += 30
    if (profile.specialization) {
      const ps = profile.specialization.toLowerCase().trim()
      const js = job.required_specialization.toLowerCase().trim()
      if (ps === js) score += 30
    }
  }

  if (job.required_qualification) {
    totalPossible += 20
    if (profile.qualification) {
      const pq = profile.qualification.toLowerCase().trim()
      const jq = job.required_qualification.toLowerCase()
      const qualKeywords = [
        'bsc',
        'bachelor',
        'hnd',
        'diploma',
        'msc',
        'master',
        'phd',
        'degree',
        'certificate',
        'b.sc',
        'b.ed',
      ]
      const pk = qualKeywords.find((k) => pq.includes(k))
      if (pq === jq || (pk && jq.includes(pk)) || jq.includes(pq)) {
        score += 20
      }
    }
  }

  const reqYears = job.required_experience_years ?? 0
  if (reqYears > 0) {
    totalPossible += 10
    const candYears = profile.years_of_experience ?? 0
    if (candYears >= reqYears) score += 10
    else if (candYears > 0) score += Math.round((candYears / reqYears) * 10)
  }

  if (job.required_institution_type && job.required_institution_type !== 'any') {
    totalPossible += 10
    if (profile.institution_type === job.required_institution_type) score += 10
  }

  if (totalPossible === 0) return 50
  return Math.min(100, Math.round((score / totalPossible) * 100))
}

export function calculateMatchScoreFromExtracted(
  extracted: {
    qualification?: string | null
    experience_years?: number | null
    specialization?: string | null
    region?: string | null
    city?: string | null
    preferred_regions?: string[] | null
    preferred_cities?: string[] | null
  },
  job: Job
): number {
  const fakeProfile = {
    qualification: extracted.qualification ?? null,
    years_of_experience: extracted.experience_years ?? null,
    specialization: extracted.specialization ?? null,
    preferred_region: extracted.region ?? null,
    city: extracted.city ?? null,
    preferred_regions: extracted.preferred_regions ?? null,
    preferred_cities: extracted.preferred_cities ?? null,
    institution_type: null,
  } as unknown as Profile
  return calculateMatchScore(fakeProfile, job)
}
