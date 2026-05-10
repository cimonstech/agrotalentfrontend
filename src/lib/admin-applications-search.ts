import type { SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_APPLICATIONS_SEARCH_MIN_CHARS = 2
/** Cap ID lists so `.in()` queries stay fast and URLs stay small. */
export const ADMIN_APPLICATIONS_SEARCH_MAX_IDS = 200

/** Normalize free-text search for ilike patterns (avoid breaking PostgREST filters). */
export function sanitizeAdminApplicationsSearch(raw: string): string {
  return raw
    .trim()
    .replace(/["'()]/g, ' ')
    .replace(/[%_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export type SearchIdsResult =
  | { kind: 'skip' }
  | { kind: 'none' }
  | { kind: 'failed'; message: string }
  | { kind: 'match'; applicantIds: string[]; jobIds: string[] }

/**
 * Resolve applicant + job IDs for OR-filtering applications (name, email, job title, poster org).
 * Runs parallel indexed queries with tight limits — suitable for large tables when indexes exist.
 */
export async function resolveApplicationSearchIds(
  supabase: SupabaseClient,
  rawSearch: string
): Promise<SearchIdsResult> {
  const term = sanitizeAdminApplicationsSearch(rawSearch)
  if (term.length < ADMIN_APPLICATIONS_SEARCH_MIN_CHARS) {
    return { kind: 'skip' }
  }
  const pat = `%${term}%`

  const applicantRoles = ['graduate', 'student', 'skilled'] as const

  const [profRes, jobRes, farmRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .in('role', [...applicantRoles])
      .or(`full_name.ilike.${pat},email.ilike.${pat}`)
      .limit(ADMIN_APPLICATIONS_SEARCH_MAX_IDS),
    supabase.from('jobs').select('id').ilike('title', pat).limit(ADMIN_APPLICATIONS_SEARCH_MAX_IDS),
    supabase
      .from('profiles')
      .select('id')
      .eq('role', 'farm')
      .or(`farm_name.ilike.${pat},full_name.ilike.${pat}`)
      .limit(80),
  ])

  if (profRes.error) {
    return { kind: 'failed', message: profRes.error.message }
  }
  if (jobRes.error) {
    return { kind: 'failed', message: jobRes.error.message }
  }
  if (farmRes.error) {
    return { kind: 'failed', message: farmRes.error.message }
  }

  const applicantIds = Array.from(
    new Set((profRes.data ?? []).map((r: { id: string }) => r.id))
  )

  const jobIdsTitle = (jobRes.data ?? []).map((r: { id: string }) => r.id)
  const farmIds = (farmRes.data ?? []).map((r: { id: string }) => r.id)

  let jobIdsFromFarm: string[] = []
  if (farmIds.length > 0) {
    const { data: jobsByFarm, error: jbfErr } = await supabase
      .from('jobs')
      .select('id')
      .in('farm_id', farmIds)
      .limit(ADMIN_APPLICATIONS_SEARCH_MAX_IDS)
    if (jbfErr) {
      return { kind: 'failed', message: jbfErr.message }
    }
    jobIdsFromFarm = (jobsByFarm ?? []).map((r: { id: string }) => r.id)
  }

  const jobIds = Array.from(new Set([...jobIdsTitle, ...jobIdsFromFarm]))

  if (applicantIds.length === 0 && jobIds.length === 0) {
    return { kind: 'none' }
  }

  return { kind: 'match', applicantIds, jobIds }
}
