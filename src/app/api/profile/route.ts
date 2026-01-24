import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile - Proxy to backend
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const authHeader = request.headers.get('authorization')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    const response = await fetch(`${backendUrl}/api/profile`, {
      method: 'GET',
      headers,
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Proxy to backend
export async function PATCH(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const authHeader = request.headers.get('authorization')
    const body = await request.json()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    
    const response = await fetch(`${backendUrl}/api/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
