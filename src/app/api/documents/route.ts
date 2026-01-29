import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// Proxy to backend so Bearer tokens work consistently.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/documents')
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/documents')
}
