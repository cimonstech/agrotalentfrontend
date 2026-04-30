import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')

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

  try {
    const auth = request.headers.get('authorization') || ''
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch(`${BACKEND_BASE}/api/admin/notices/upload-image`, {
      method: 'POST',
      headers: auth ? { Authorization: auth } : {},
      body: fd,
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 })
  }
}
