import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// Proxy to backend so Bearer tokens work consistently.
// Note: Backend route is /api/applications/applicants (applications router has /applicants route)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/applications/applicants')
}
