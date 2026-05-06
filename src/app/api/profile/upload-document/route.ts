import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function backendBaseUrl() {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '')
}

// POST /api/profile/upload-document
// Proxies to the backend /api/documents endpoint (Cloudflare R2 storage).
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const incoming = await request.formData()
    const outgoing = new FormData()
    incoming.forEach((value, key) => {
      outgoing.append(key === 'type' ? 'document_type' : key, value)
    })

    const backendBase = backendBaseUrl()
    const internalSecret = process.env.INTERNAL_API_SECRET

    let res: Response
    try {
      res = await fetch(`${backendBase}/api/documents`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.access_token}`,
          ...(internalSecret ? { 'x-internal-secret': internalSecret } : {}),
        },
        body: outgoing,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed'
      return NextResponse.json(
        {
          error: `${msg}. Is the API running? Set API_URL (server) or NEXT_PUBLIC_API_URL to ${backendBase}.`,
        },
        { status: 502 }
      )
    }

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: (json as { error?: string }).error || 'Upload failed' },
        { status: res.status }
      )
    }

    const doc = (json as { document?: { file_url?: string } }).document
    return NextResponse.json({
      url: doc?.file_url,
      document: doc,
      message:
        (json as { message?: string }).message ||
        'Document uploaded successfully',
    })
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Failed to upload document'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
