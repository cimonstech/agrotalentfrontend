import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user.app_metadata?.role as string | undefined) ?? (user.user_metadata?.role as string | undefined)
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res = await proxyToBackend(request, '/api/admin/ensure-unknown-farm')
  if (res.status === 404) {
    return NextResponse.json(
      { error: 'Ensure-unknown-farm endpoint not found. Restart the backend server to load the latest routes.' },
      { status: 502 }
    )
  }
  return res
}
