import { NextRequest } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAdminProxy(request, `/api/admin/trainings/${params.id}/assign`)
}
