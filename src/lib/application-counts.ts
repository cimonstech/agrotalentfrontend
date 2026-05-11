import type { SupabaseClient } from '@supabase/supabase-js'

/** Keep `.in('job_id', chunk)` payloads modest for PostgREST URL limits. */
const JOB_ID_CHUNK = 120

/**
 * Live application totals per job from `applications` (respects RLS).
 * Jobs with no rows are omitted — use `counts[id] ?? fallback`.
 */
export async function fetchApplicationCountsByJobIds(
  client: SupabaseClient,
  jobIds: string[]
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(jobIds.filter(Boolean)))
  if (unique.length === 0) return {}

  const counts: Record<string, number> = {}

  for (let i = 0; i < unique.length; i += JOB_ID_CHUNK) {
    const chunk = unique.slice(i, i + JOB_ID_CHUNK)
    const { data, error } = await client
      .from('applications')
      .select('job_id')
      .in('job_id', chunk)

    if (error) {
      console.warn('[fetchApplicationCountsByJobIds]', error.message)
      continue
    }
    for (const row of data ?? []) {
      const jid = row.job_id as string | null
      if (!jid) continue
      counts[jid] = (counts[jid] ?? 0) + 1
    }
  }

  return counts
}
