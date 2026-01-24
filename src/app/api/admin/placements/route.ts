import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_utils/proxy'

// GET /api/admin/placements - List all placements (Admin only)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/placements')
}
