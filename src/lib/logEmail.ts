import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface LogEmailParams {
  recipient_email: string
  recipient_name?: string
  subject: string
  type: string
  status: 'sent' | 'failed'
  error_message?: string
  metadata?: Record<string, unknown>
}

export async function logEmail(params: LogEmailParams): Promise<void> {
  try {
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: params.recipient_email,
      recipient_name: params.recipient_name ?? null,
      subject: params.subject,
      type: params.type,
      status: params.status,
      error_message: params.error_message ?? null,
      metadata: params.metadata ?? {},
      sent_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Failed to log email:', err)
  }
}
