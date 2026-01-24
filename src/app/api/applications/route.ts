import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// Proxy to backend so Bearer tokens (localStorage) work consistently.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/applications')
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/applications')
}
