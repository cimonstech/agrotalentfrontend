import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function buildHtmlRedirect(
  destUrl: string,
  cookies: Array<Parameters<typeof NextResponse.prototype.cookies.set>>
): NextResponse {
  // Use an intermediate 200 HTML page instead of a 3xx redirect so that
  // Set-Cookie headers are reliably processed by the browser before navigation.
  const escaped = destUrl.replace(/"/g, '&quot;')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${escaped}">
<script>window.location.replace(${JSON.stringify(destUrl)})</script>
</head><body>Redirecting…</body></html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  for (const args of cookies) {
    response.cookies.set(...args)
  }
  return response
}

export async function GET(request: NextRequest) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  // Prefer the request's own origin so cookies are always same-origin.
  // Fall back to NEXT_PUBLIC_SITE_URL only when origin is not available.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? null

  if (!code && !token_hash) {
    return NextResponse.redirect(new URL('/auth/error', origin))
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.redirect(new URL('/auth/error', origin))
  }

  const pendingCookies: Array<Parameters<typeof NextResponse.prototype.cookies.set>> = []

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push([name, value, options])
            })
          },
        },
      }
    )

    let error: { message: string } | null = null

    if (token_hash && type) {
      const result = await supabase.auth.verifyOtp({
        token_hash,
        type: type as
          | 'email'
          | 'signup'
          | 'recovery'
          | 'invite'
          | 'magiclink'
          | 'email_change',
      })
      error = result.error
    } else if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code)
      error = result.error
    }

    if (error) {
      console.error('auth/callback session error:', error.message)
      return NextResponse.redirect(new URL('/auth/error', origin))
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('auth/callback: session established but getUser() returned null')
      return NextResponse.redirect(new URL('/auth/error', origin))
    }

    let dest = '/auth/complete-profile'

    if (next) {
      dest = next
    } else {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role) {
        const roleRoutes: Record<string, string> = {
          farm: '/dashboard/farm',
          graduate: '/dashboard/graduate',
          student: '/dashboard/student',
          skilled: '/dashboard/skilled',
          admin: '/dashboard/admin',
        }
        dest = roleRoutes[profile.role] ?? '/auth/complete-profile'
      }
    }

    return buildHtmlRedirect(new URL(dest, origin).toString(), pendingCookies)
  } catch (err) {
    console.error('auth/callback unexpected error:', err)
    return NextResponse.redirect(new URL('/auth/error', origin))
  }
}
