// Utility functions for authentication

import { createClient } from '@supabase/supabase-js'

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Get current session and auth token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
