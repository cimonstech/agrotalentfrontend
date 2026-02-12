import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export async function POST(request: NextRequest) {
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
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
