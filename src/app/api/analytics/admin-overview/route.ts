import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const accessToken = session?.access_token ?? ''

  const modifiedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      Authorization: 'Bearer ' + accessToken,
    },
  })

  return proxyToBackend(modifiedRequest, '/api/analytics/admin-overview')
}

