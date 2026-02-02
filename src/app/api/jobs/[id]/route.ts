import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// Force dynamic rendering to ensure route is recognized
export const dynamic = 'force-dynamic'

// PATCH /api/jobs/:id - Update job (Farm or Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/jobs/${params.id}`)
}

// DELETE /api/jobs/:id - Delete job (Farm or Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/jobs/${params.id}`)
}
