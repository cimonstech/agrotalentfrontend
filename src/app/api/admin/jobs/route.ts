import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// Proxy to backend so Bearer tokens work consistently.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/jobs')
}

// DELETE /api/admin/jobs - Delete all jobs (Admin only)
export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/jobs')
}
