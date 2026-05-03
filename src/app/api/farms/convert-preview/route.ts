import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_FETCH_MS = 25_000

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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { token?: string }
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const backendBase = backendBaseUrl()
    const accessToken = authHeader.slice(7).trim()

    let csrfRes: Response
    try {
      csrfRes = await fetch(`${backendBase}/api/csrf-token`, {
        method: 'GET',
        headers: { authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(BACKEND_FETCH_MS),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed'
      return NextResponse.json(
        {
          error: `${msg}. Is the API running? Set API_URL or NEXT_PUBLIC_API_URL.`,
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
      res = await fetch(`${backendBase}/api/farms/convert-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${accessToken}`,
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ token: body.token }),
        signal: AbortSignal.timeout(BACKEND_FETCH_MS),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed'
      return NextResponse.json(
        { error: `${msg}. Is the API running?` },
        { status: 502 }
      )
    }

    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
