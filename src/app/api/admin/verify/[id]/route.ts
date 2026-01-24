import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../../_utils/proxy'

// POST /api/admin/verify/[id] - Verify a user profile (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Keep same route signature but proxy to backend
  return proxyToBackend(request, `/api/admin/verify/${params.id}`)
}
