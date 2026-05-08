import { NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

function isValidToken(v: string | undefined): v is string {
  if (!v) return false
  return /^[0-9a-f]{64}$/.test(v)
}

/**
 * Generates a CSRF token and sets it as an httpOnly cookie directly from
 * Next.js. Previously this proxied to Express, but Express cannot set cookies
 * that the browser will honour because the Set-Cookie domain comes from the
 * wrong origin (port 3001 vs the Next.js origin the browser trusts).
 */
export async function GET(request: Request) {
  const cookieToken = (() => {
    try {
      const cookieHeader = request.headers.get('cookie') ?? ''
      const m = cookieHeader.match(/(?:^|;\s*)x-csrf-token=([^;]+)/)
      return m ? decodeURIComponent(m[1]) : undefined
    } catch {
      return undefined
    }
  })()

  const token = isValidToken(cookieToken) ? cookieToken : generateCsrfToken()
  const response = NextResponse.json({ token })

  // Always refresh the cookie so its expiry stays ahead of the api-client's
  // 55-minute cache TTL. Without this, a cache refresh at T=55min reuses the
  // existing token but doesn't extend the cookie, which then expires at T=60min
  // while the cache remains valid until T=110min — causing a stale-header/no-cookie mismatch.
  response.cookies.set('x-csrf-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  return response
}
