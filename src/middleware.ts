import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware so Next.js generates middleware-manifest.json (fixes MODULE_NOT_FOUND in dev).
export function middleware(request: NextRequest) {
  return NextResponse.next()
}
