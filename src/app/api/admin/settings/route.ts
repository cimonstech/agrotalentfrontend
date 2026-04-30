import { NextRequest } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

export async function GET(request: NextRequest) {
  return requireAdminProxy(request, '/api/admin/settings')
}

export async function PUT(request: NextRequest) {
  return requireAdminProxy(request, '/api/admin/settings')
}
