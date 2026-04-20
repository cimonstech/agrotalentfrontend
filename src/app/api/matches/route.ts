import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/app/api/_utils/proxy'

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/matches')
}
