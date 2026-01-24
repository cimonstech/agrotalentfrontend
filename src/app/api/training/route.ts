import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend } from '../_utils/proxy'

// GET /api/training - My assigned trainings (proxied to backend)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/training')
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
