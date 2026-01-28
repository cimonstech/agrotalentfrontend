import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/admin/documents/${params.id}/approve`)
}
