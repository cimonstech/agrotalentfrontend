import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_utils/proxy'

// GET /api/admin/reports - Generate reports (Admin only)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/reports')
}
