import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_utils/proxy'

// GET /api/admin/contact - Get contact form submissions (Admin only)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/contact')
}
