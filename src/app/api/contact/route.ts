import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { name, email, phone, subject, message } = body
    
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }
    
    // Store in database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        status: 'new'
      })
      .select()
      .single()
    
    if (dbError) {
      // If table doesn't exist yet, continue without storing
      console.warn('Contact submissions table not found:', dbError.message)
    }
    
    // Send email via Resend (if configured)
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'AgroTalent Hub <noreply@agrotalenthub.com>',
            to: 'agrotalenthub@gmail.com',
            replyTo: email,
            subject: `Contact Form: ${subject || 'General Inquiry'}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            `
          })
        })
      } catch (emailError) {
        console.error('Failed to send contact email:', emailError)
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json(
      {
        message: 'Thank you for contacting us. We will get back to you soon!'
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
