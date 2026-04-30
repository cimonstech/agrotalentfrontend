import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    if (!payload.id || !payload.email || !payload.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      console.error('[create-profile] Error:', error)
      // Unique constraint on email — account already exists
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[create-profile] Caught:', err)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
