import { NextRequest, NextResponse } from 'next/server'

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
  return out
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const backendBase = getBackendBaseUrl()
  const url = new URL(req.url)

  const targetUrl = new URL(`${backendBase}${backendPath}`)
  // preserve query params
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
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Service is temporarily unavailable. Please try again.',
      },
      { status: 502 }
    )
  }

  const text = await res.text()
  // 204/205 must have no body — Node/undici reject status 204 with a body
  const status = res.status
  const resBody = status === 204 || status === 205 ? undefined : text
  return new NextResponse(resBody, {
    status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json'
    }
  })
}

