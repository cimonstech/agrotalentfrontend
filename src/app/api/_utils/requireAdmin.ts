import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { proxyToBackend } from './proxy'

export async function requireAdminProxy(req: NextRequest, backendPath: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get session token to inject into the forwarded request.
  // Express's authenticate middleware requires Authorization: Bearer — it has no cookie fallback.
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token

  const roleFromJwt =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined)

  if (roleFromJwt === 'admin') {
    return proxyToBackend(req, backendPath, accessToken)
  }

  // Many sessions only have role on `profiles`; Express auth merges this, but the proxy must match.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return proxyToBackend(req, backendPath, accessToken)
}
