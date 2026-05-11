import { NextRequest, NextResponse } from 'next/server'
import { requireAdminProxy } from '@/app/api/_utils/requireAdmin'

/** Proxies to Express: GET /api/admin/communications/logs/for-user/:userId */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const id = String(userId ?? '').trim()
  if (!id) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  return requireAdminProxy(
    request,
    `/api/admin/communications/logs/for-user/${encodeURIComponent(id)}`
  )
}
