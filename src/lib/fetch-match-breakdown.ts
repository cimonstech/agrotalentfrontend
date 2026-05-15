import { getSessionOnce } from '@/lib/get-session-once'
import type { MatchBreakdownData } from '@/components/dashboard/MatchBreakdown'

export async function fetchMatchBreakdown(
  applicationId: string
): Promise<MatchBreakdownData | null> {
  const session = await getSessionOnce()
  const token = session?.access_token
  if (!token) return null

  try {
    const res = await fetch(`/api/applications/${applicationId}/match-breakdown`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as MatchBreakdownData & { error?: string }
    if (!res.ok || !Array.isArray(data.factors)) return null
    return data
  } catch {
    return null
  }
}
