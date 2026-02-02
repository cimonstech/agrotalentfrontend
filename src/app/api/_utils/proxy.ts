import { NextRequest, NextResponse } from 'next/server'

function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const backendBase = getBackendBaseUrl()
  const url = new URL(req.url)

  const targetUrl = new URL(`${backendBase}${backendPath}`)
  // preserve query params
  url.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value))

  const auth = req.headers.get('authorization') || ''

  const res = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: {
      ...(auth ? { authorization: auth } : {}),
      // preserve content-type for JSON bodies
      ...(req.headers.get('content-type') ? { 'content-type': req.headers.get('content-type')! } : {})
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()
  })

  const text = await res.text()
  // 204/205 must have no body — Node/undici reject status 204 with a body
  const status = res.status
  const body = status === 204 || status === 205 ? undefined : text
  return new NextResponse(body, {
    status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json'
    }
  })
}

