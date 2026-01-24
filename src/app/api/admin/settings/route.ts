import { NextRequest } from 'next/server'
import { proxyToBackend } from '../../_utils/proxy'

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/settings')
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/api/admin/settings')
}

