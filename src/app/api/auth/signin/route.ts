import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/signin - Proxy to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 500 }
    )
  }
}
