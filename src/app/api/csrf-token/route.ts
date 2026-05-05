import { NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

/**
 * Generates a CSRF token and sets it as an httpOnly cookie directly from
 * Next.js. Previously this proxied to Express, but Express cannot set cookies
 * that the browser will honour because the Set-Cookie domain comes from the
 * wrong origin (port 3001 vs the Next.js origin the browser trusts).
 */
export async function GET() {
  const token = generateCsrfToken()
  const response = NextResponse.json({ token })

  response.cookies.set('x-csrf-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  return response
}
