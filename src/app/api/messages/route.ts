import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages - Get conversations and messages
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
    const conversationId = searchParams.get('conversation_id')
    
    if (conversationId) {
      // Get messages for a specific conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      return NextResponse.json({ messages }, { status: 200 })
    } else {
      // Get all conversations for user
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          farm:farm_id (
            id,
            farm_name,
            farm_type
          ),
          graduate:graduate_id (
            id,
            full_name,
            qualification
          ),
          job:job_id (
            id,
            title
          ),
          messages:messages (
            id,
            content,
            sender_id,
            read,
            created_at
          )
        `)
        .or(`farm_id.eq.${user.id},graduate_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
      
      if (error) throw error
      
      return NextResponse.json({ conversations }, { status: 200 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
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
    const { conversation_id, recipient_id, job_id, content } = body
    
    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }
    
    // Get user profile to determine if they're farm or graduate
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    let conversationId = conversation_id
    
    // Create conversation if it doesn't exist
    if (!conversationId) {
      if (!recipient_id || !job_id) {
        return NextResponse.json(
          { error: 'recipient_id and job_id required for new conversation' },
          { status: 400 }
        )
      }
      
      // Determine farm_id and graduate_id
      const farmId = profile.role === 'farm' ? user.id : recipient_id
      const graduateId = profile.role === 'farm' ? recipient_id : user.id
      
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('farm_id', farmId)
        .eq('graduate_id', graduateId)
        .eq('job_id', job_id)
        .single()
      
      if (existing) {
        conversationId = existing.id
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            farm_id: farmId,
            graduate_id: graduateId,
            job_id: job_id
          })
          .select()
          .single()
        
        if (convError) throw convError
        conversationId = newConversation.id
      }
    }
    
    // Send message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
    
    // Create notification for recipient
    const { data: conversation } = await supabase
      .from('conversations')
      .select('farm_id, graduate_id')
      .eq('id', conversationId)
      .single()
    
    const recipientId = conversation?.farm_id === user.id 
      ? conversation.graduate_id 
      : conversation?.farm_id
    
    if (recipientId) {
      const recipientRole = recipientId === conversation?.farm_id ? 'farm' : 'graduate'
      const recipientDashboardBase = recipientRole === 'farm' ? '/dashboard/farm' : '/dashboard/graduate'

      await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'application_received', // Reuse type
          title: 'New Message',
          message: `You have a new message from ${profile.role === 'farm' ? 'an employer' : 'a candidate'}`,
          link: `${recipientDashboardBase}/messages?conversation_id=${conversationId}`
        })
    }
    
    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
