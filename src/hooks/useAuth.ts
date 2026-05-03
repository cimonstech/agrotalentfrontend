'use client'

import { useEffect } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { useAuthStore } from '@/store/auth'

const supabase = createSupabaseClient()

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[useAuth] profile fetch error:', error)
    return null
  }
  return data as Profile | null
}

export function useAuth() {
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const session = useAuthStore((s) => s.session)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isLoading = useAuthStore((s) => s.isLoading)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return

      // Always keep the stored token in sync — no getSession() needed anywhere else.
      setSession(session)

      if (event === 'INITIAL_SESSION') {
        // INITIAL_SESSION fires from localStorage — no network call, no navigator lock.
        if (!session?.user) {
          clear()
          return
        }
        setLoading(true)
        try {
          const nextProfile = await fetchProfile(session.user.id)
          if (cancelled) return
          setProfile(nextProfile)
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        clear()
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(true)
        try {
          const nextProfile = await fetchProfile(session.user.id)
          if (cancelled) return
          setProfile(nextProfile)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setProfile, setSession, setLoading, clear])

  return { profile, role, session, accessToken, isLoading }
}
