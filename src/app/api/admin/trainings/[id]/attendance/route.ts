import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../../../_utils/proxy'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/admin/trainings/${params.id}/attendance`)
}

