import { NextRequest } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

export async function GET(request: NextRequest) {
  return requireAdminProxy(request, '/api/admin/trainings')
}

export async function POST(request: NextRequest) {
  return requireAdminProxy(request, '/api/admin/trainings')
}
