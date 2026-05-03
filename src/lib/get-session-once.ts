// Deduplication wrapper around supabase.auth.getSession().
//
// Primary path: return the session already stored in the auth store (populated
// by useAuth via onAuthStateChange INITIAL_SESSION — no lock, no network).
//
// Fallback: if the store is empty (very first load before useAuth mounts),
// call getSession() exactly ONCE regardless of how many concurrent callers
// there are. All callers share the same Promise so the navigator lock is
// only acquired a single time.

import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import type { Session } from '@supabase/supabase-js'

let pending: Promise<Session | null> | null = null

export async function getSessionOnce(): Promise<Session | null> {
  // Fast path — no lock needed.
  const stored = useAuthStore.getState().session
  if (stored) return stored

  // All concurrent callers share a single getSession() promise.
  if (!pending) {
    pending = createSupabaseClient()
      .auth.getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        const s = data.session
        if (s) useAuthStore.getState().setSession(s)
        pending = null
        return s
      })
      .catch(() => {
        pending = null
        return null
      })
  }

  return pending
}
