import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getBackendBaseUrl() {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '')
}

/**
 * Proxies GET /api/csrf-token to the Express API so the browser receives the
 * CSRF cookie. Returns 503 with a clear message when the API is not running.
 */
export async function GET(request: NextRequest) {
  const backendBase = getBackendBaseUrl()
  const target = `${backendBase}/api/csrf-token`
  const cookie = request.headers.get('cookie') ?? ''
  const authorization = request.headers.get('authorization') ?? ''

  const forwardHeaders: Record<string, string> = {}
  if (cookie) forwardHeaders['cookie'] = cookie
  if (authorization) forwardHeaders['authorization'] = authorization

  let res: Response
  try {
    res = await fetch(target, {
      method: 'GET',
      headers: forwardHeaders,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const refused =
      /ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg) ||
      (typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        String((e as { code?: string }).code) === 'ECONNREFUSED')
    return NextResponse.json(
      {
        error: refused
          ? `Cannot reach API at ${backendBase}. Start the backend (for example: cd backend && npm run dev) on that host and port, or set API_URL in frontend/.env.local to match.`
          : msg,
      },
      { status: 503 }
    )
  }

  const text = await res.text()
  const next = new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  })

  if (typeof res.headers.getSetCookie === 'function') {
    for (const c of res.headers.getSetCookie()) {
      next.headers.append('Set-Cookie', c)
    }
  } else {
    const single = res.headers.get('set-cookie')
    if (single) next.headers.append('Set-Cookie', single)
  }

  return next
}
