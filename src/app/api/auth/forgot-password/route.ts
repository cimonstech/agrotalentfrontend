import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailRaw = body?.email
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const originHeader = request.headers.get('origin')
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      originHeader ||
      'http://localhost:3000'
    ).replace(/\/+$/, '')

    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: resetError } = await supabasePublic.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${siteUrl}/auth/callback?next=/reset-password` }
    )

    if (resetError) {
      return NextResponse.json(
        { error: resetError.message || 'Failed to send password reset email' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers()
    const normalized = email.toLowerCase()
    const user = users.find(
      (u) => (u.email ?? '').toLowerCase() === normalized
    )
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { password_reset_required: true },
      })
    }

    return NextResponse.json({
      message:
        'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to send password reset email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
