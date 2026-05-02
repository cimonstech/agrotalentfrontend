import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const passwordResetRequired =
    (
      user?.app_metadata as { password_reset_required?: boolean } | undefined
    )?.password_reset_required === true

  if (passwordResetRequired) {
    if (
      !pathname.startsWith('/reset-password') &&
      !pathname.startsWith('/auth') &&
      !pathname.startsWith('/api')
    ) {
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
  }

  // API routes: return JSON, never redirect.
  if (pathname.startsWith('/api/admin') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (pathname === '/auth/complete-profile') {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    return supabaseResponse
  }

  if (pathname.startsWith('/dashboard') && !user) {
    const signin = new URL('/signin', request.url)
    signin.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signin)
  }

  // Block non-admin users from /dashboard/admin server-side — but ONLY when
  // the role is explicitly set in the JWT (app_metadata or user_metadata).
  // If neither is set the DB is authoritative; let the client-side layout enforce it.
  if (user && pathname.startsWith('/dashboard/admin')) {
    const role =
      (user.app_metadata as Record<string, unknown> | undefined)?.role ||
      (user.user_metadata as Record<string, unknown> | undefined)?.role
    if (typeof role === 'string' && role !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/complete-profile',
    '/api/admin/:path*',
    '/reset-password',
  ],
}
