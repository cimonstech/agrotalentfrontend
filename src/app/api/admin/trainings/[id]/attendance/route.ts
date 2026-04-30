import { NextRequest } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAdminProxy(request, `/api/admin/trainings/${params.id}/attendance`)
}
