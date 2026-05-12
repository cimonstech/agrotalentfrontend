import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function backendBaseUrl() {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '')
}

/** Public: server-side fetch to Express; token is the credential. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolved =
    'then' in params && typeof (params as Promise<{ token: string }>).then === 'function'
      ? await (params as Promise<{ token: string }>)
      : (params as { token: string })
  const token = resolved.token
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const url = `${backendBaseUrl()}/api/farms/preview/${encodeURIComponent(token)}/applications`

  try {
    const secret = process.env.INTERNAL_API_SECRET
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(secret ? { 'x-internal-secret': secret } : {}),
      },
      next: { revalidate: 0 },
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Service is temporarily unavailable.' },
      { status: 502 }
    )
  }
}
