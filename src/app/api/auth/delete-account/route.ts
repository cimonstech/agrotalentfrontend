import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await supabaseAdmin.from('profiles').update({
      full_name: 'Deleted User',
      phone: null,
      email: 'deleted-' + user.id + '@deleted.agrotalenthub.com',
      farm_name: null,
      farm_address: null,
      institution_name: null,
      cv_url: null,
      certificate_url: null,
      transcript_url: null,
      nss_letter_url: null,
      skills: null,
      previous_employer: null,
      reference_name: null,
      reference_phone: null,
      reference_relationship: null,
      experience_description: null,
    }).eq('id', user.id)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
