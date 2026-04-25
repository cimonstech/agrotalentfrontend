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

function setCookieHeaderFromResponse(res: Response): string {
  const fn = res.headers.getSetCookie?.bind(res.headers)
  if (typeof fn === 'function') {
    const list = fn()
    if (list?.length) {
      return list.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ')
    }
  }
  const single = res.headers.get('set-cookie')
  if (single) {
    return single
      .split(/,(?=[^;]+?=)/)
      .map((part) => part.split(';')[0].trim())
      .filter(Boolean)
      .join('; ')
  }
  return ''
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

    let csrfRes: Response
    try {
      csrfRes = await fetch(`${backendBase}/api/csrf-token`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
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

    if (!csrfRes.ok) {
      return NextResponse.json(
        { error: 'Could not obtain CSRF token from API' },
        { status: 502 }
      )
    }

    const csrfJson = (await csrfRes.json().catch(() => ({}))) as {
      token?: string
    }
    const csrfToken =
      typeof csrfJson.token === 'string' ? csrfJson.token : ''
    const cookieHeader = setCookieHeaderFromResponse(csrfRes)

    let res: Response
    try {
      res = await fetch(`${backendBase}/api/documents`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.access_token}`,
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        body: outgoing,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed'
      return NextResponse.json(
        {
          error: `${msg}. Is the API running? Set API_URL (server) or NEXT_PUBLIC_API_URL.`,
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
