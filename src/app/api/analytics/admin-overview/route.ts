import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: 'Bearer ' + token,
      apikey: supabaseAnonKey,
    },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = (await userRes.json()) as {
    app_metadata?: { role?: string }
    user_metadata?: { role?: string }
  }

  const role =
    (userData.app_metadata?.role as string | undefined) ??
    (userData.user_metadata?.role as string | undefined)

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return proxyToBackend(request, '/api/analytics/admin-overview')
}

