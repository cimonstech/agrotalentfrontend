import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/applications/${params.id}`)
}
