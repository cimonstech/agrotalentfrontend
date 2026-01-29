import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/applications/${params.id}/documents`)
}
