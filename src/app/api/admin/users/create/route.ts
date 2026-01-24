import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../../_utils/proxy'

// POST /api/admin/users/create - Create user (Super Admin only)
export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/users/create')
}
