import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfToken } from '@/lib/csrf'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getBackendBaseUrl() {
  const fromEnv =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001'
  return fromEnv.replace(/\/$/, '')
}

function buildForwardHeaders(req: NextRequest): HeadersInit {
  const out: Record<string, string> = {}
  const auth = req.headers.get('authorization')
  if (auth) out['authorization'] = auth
  const ct = req.headers.get('content-type')
  if (ct) out['content-type'] = ct
  const csrf = req.headers.get('x-csrf-token')
  if (csrf) out['x-csrf-token'] = csrf
  const cookie = req.headers.get('cookie')
  if (cookie) out['cookie'] = cookie

  // Tells Express this request came from the trusted Next.js server so it can
  // skip its own csrf-csrf check (which cannot receive cookies from the browser).
  const secret = process.env.INTERNAL_API_SECRET
  if (secret) out['x-internal-secret'] = secret

  return out
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  // Validate CSRF at the Next.js boundary for all state-mutating requests.
  // The cookie was set by Next.js (/api/csrf-token) so its origin is correct.
  if (MUTATING_METHODS.has(req.method)) {
    const cookieToken = req.cookies.get('x-csrf-token')?.value
    const headerToken = req.headers.get('x-csrf-token') ?? undefined
    if (!verifyCsrfToken(cookieToken, headerToken)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }

  const backendBase = getBackendBaseUrl()
  const url = new URL(req.url)

  const targetUrl = new URL(`${backendBase}${backendPath}`)
  url.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value))

  const method = req.method
  let forwardBody: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const buf = await req.arrayBuffer()
    forwardBody = buf.byteLength > 0 ? buf : undefined
  }

  let res: Response
  try {
    res = await fetch(targetUrl.toString(), {
      method,
      headers: buildForwardHeaders(req),
      body: forwardBody,
    })
  } catch {
    return NextResponse.json(
      { error: 'Service is temporarily unavailable. Please try again.' },
      { status: 502 }
    )
  }

  const text = await res.text()
  const status = res.status
  const resBody = status === 204 || status === 205 ? undefined : text
  return new NextResponse(resBody, {
    status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  })
}
