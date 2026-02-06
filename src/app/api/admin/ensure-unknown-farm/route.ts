import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

// POST /api/admin/ensure-unknown-farm - Get or create "Farm (unknown)" placeholder
export async function POST(request: NextRequest) {
  const res = await proxyToBackend(request, '/api/admin/ensure-unknown-farm')
  if (res.status === 404) {
    return NextResponse.json(
      { error: 'Ensure-unknown-farm endpoint not found. Restart the backend server to load the latest routes.' },
      { status: 502 }
    )
  }
  return res
}
