import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL('/agrotalent-logo.webp', request.url)
  return NextResponse.redirect(url)
}
