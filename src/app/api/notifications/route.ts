import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (unreadOnly) {
      query = query.eq('read', false)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ notifications: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { notification_ids, mark_all_read } = body
    
    if (mark_all_read) {
      // Mark all user's notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
      
      if (error) throw error
      
      return NextResponse.json({ message: 'All notifications marked as read' }, { status: 200 })
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notification_ids)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
