// Utility functions for authentication

import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

/**
 * True when Supabase returns "Refresh Token Not Found" (token revoked/expired server-side).
 * Call supabase.auth.signOut({ scope: 'local' }) and redirect to sign-in when this happens.
 */
export function isInvalidRefreshTokenError(error: any): boolean {
  if (!error) return false
  return (
    error?.code === 'refresh_token_not_found' ||
    (typeof error?.message === 'string' && /refresh token not found|invalid refresh token/i.test(error.message))
  )
}

/**
 * True when a request was aborted (timeout, navigation, or explicit abort).
 * Use to avoid logging or showing these as user-visible errors.
 */
export function isAbortError(error: any): boolean {
  if (!error) return false
  return (
    error?.name === 'AbortError' ||
    (typeof error?.message === 'string' && /signal is aborted|aborted without reason/i.test(error.message))
  )
}

/**
 * Get current session and auth token.
 * Reads from the auth store (populated by useAuth via onAuthStateChange) — no getSession() call.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = useAuthStore.getState().accessToken

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Check if user is authenticated.
 * Reads from the auth store — no getSession() call.
 */
export async function isAuthenticated(): Promise<boolean> {
  return !!useAuthStore.getState().session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await createSupabaseClient().auth.getUser()
  return user
}
