import { NextRequest } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

export async function POST(request: NextRequest) {
  return requireAdminProxy(request, '/api/admin/users/create')
}
