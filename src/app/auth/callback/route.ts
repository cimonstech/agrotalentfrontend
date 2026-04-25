import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', origin))
  }

  // Collect cookies written by exchangeCodeForSession so we can attach them
  // to the redirect response. Using the cookies() helper from next/headers
  // and then returning NextResponse.redirect() leaves the session cookies on
  // a different response object, so the browser never receives them and the
  // middleware sees no session on the next request.
  const pendingCookies: Array<Parameters<typeof NextResponse.prototype.cookies.set>> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  let dest = '/auth/error'

  if (!error) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
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
      } else {
        dest = '/auth/complete-profile'
      }
    }
  }

  const redirect = NextResponse.redirect(new URL(dest, origin))

  // Attach the session cookies to the redirect so the browser stores them
  // and the middleware can read a valid session on the next request.
  for (const args of pendingCookies) {
    redirect.cookies.set(...args)
  }

  return redirect
}
