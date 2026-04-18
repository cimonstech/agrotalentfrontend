import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/notifications/:id/notice - Fetch notice for a notification (by notice_id or by matching title)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: notificationId } = await params
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .select('id, notice_id, title, type')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (notifError || !notif) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notif.notice_id) {
      const { data: notice, error } = await supabase
        .from('notices')
        .select('id, title, body_html, link, audience, attachments, created_at')
        .eq('id', notif.notice_id)
        .single()
      if (error || !notice) {
        return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
      }
      return NextResponse.json(notice, { status: 200 })
    }

    if ((notif.type === 'notice' || notif.type === 'training_notice') && notif.title) {
      const { data: notice, error } = await supabase
        .from('notices')
        .select('id, title, body_html, link, audience, attachments, created_at')
        .eq('title', notif.title)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (notice) return NextResponse.json(notice, { status: 200 })
    }

    return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notice' },
      { status: 500 }
    )
  }
}
