'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Profile, UserRole } from '@/types'

// Cached profile is considered stale after 8 hours.
const PROFILE_TTL_MS = 8 * 60 * 60 * 1000

type AuthState = {
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  cachedAt: number | null
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      role: null,
      isLoading: true,
      cachedAt: null,
      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
          cachedAt: profile ? Date.now() : null,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      clear: () =>
        set({
          profile: null,
          role: null,
          isLoading: false,
          cachedAt: null,
        }),
    }),
    {
      name: 'ath-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        role: state.role,
        cachedAt: state.cachedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Discard stale cached profile so the next load fetches a fresh one.
        if (state.cachedAt && Date.now() - state.cachedAt > PROFILE_TTL_MS) {
          state.profile = null
          state.role = null
          state.cachedAt = null
        }
      },
    }
  )
)
