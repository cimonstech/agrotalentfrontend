import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for client-side Supabase client to prevent multiple instances
let clientInstance: SupabaseClient | null = null
let componentClientInstance: SupabaseClient | null = null

export const createSupabaseClient = (): SupabaseClient => {
  // Use auth-helpers client (cookie-based) for Next.js
  try {
    if (!componentClientInstance) {
      componentClientInstance = createClientComponentClient()
    }
    return componentClientInstance
  } catch {
    // Fallback to vanilla client if auth-helpers fails
    if (!clientInstance) {
      clientInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    }
    return clientInstance
  }
}

// For server-side usage
export const createSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
