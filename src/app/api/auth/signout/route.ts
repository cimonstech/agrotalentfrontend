import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/signout - Sign out user
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign out' },
      { status: 500 }
    )
  }
}
