import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/signup - Proxy to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Proxy to backend server
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    // Add timeout and better error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return NextResponse.json(errorData, { status: response.status })
      }
      
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      console.error('Fetch error details:', {
        name: fetchError.name,
        code: fetchError.code,
        message: fetchError.message,
        cause: fetchError.cause,
        backendUrl
      })
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        )
      }
      
      // Handle connection errors
      if (fetchError.code === 'ECONNRESET' || 
          fetchError.code === 'ECONNREFUSED' ||
          fetchError.cause?.code === 'ECONNRESET' ||
          fetchError.cause?.code === 'ECONNREFUSED' ||
          fetchError.message?.includes('ECONNRESET') ||
          fetchError.message?.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: 'Backend server is not responding. Please ensure the backend is running on port 3001.',
            details: `Tried to connect to: ${backendUrl}/api/auth/signup`
          },
          { status: 503 }
        )
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('Signup proxy error:', error)
    
    // Check if it's a connection error that wasn't caught in the inner catch
    if (error.cause?.code === 'ECONNRESET' || 
        error.cause?.code === 'ECONNREFUSED' ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'Backend server is not responding. Please ensure the backend is running on port 3001.',
          details: `Connection error: ${error.cause?.code || error.code || 'Unknown'}`
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
