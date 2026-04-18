'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Profile, UserRole } from '@/types'

type AuthState = {
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
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
      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      clear: () =>
        set({
          profile: null,
          role: null,
          isLoading: false,
        }),
    }),
    {
      name: 'ath-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        role: state.role,
      }),
    }
  )
)
