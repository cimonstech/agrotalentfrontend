'use client'

import { useEffect } from 'react'
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
  const isLoading = useAuthStore((s) => s.isLoading)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    let cancelled = false

    async function syncFromUser() {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (cancelled) return

        if (!user) {
          clear()
          return
        }

        const nextProfile = await fetchProfile(user.id)
        if (cancelled) return
        setProfile(nextProfile)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    syncFromUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      if (
        event === 'SIGNED_OUT' ||
        !session?.user
      ) {
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
  }, [setProfile, setLoading, clear])

  return { profile, role, isLoading }
}
