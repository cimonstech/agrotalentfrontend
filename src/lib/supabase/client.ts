import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>

declare global {
  interface Window {
    __ATH_SUPABASE_BROWSER__?: BrowserClient
  }
}

/**
 * Single browser Supabase client. Multiple createBrowserClient instances
 * contend for the same auth storage lock and can throw
 * "Lock ... was released because another request stole it".
 */
export function createSupabaseClient(): BrowserClient {
  if (typeof window !== 'undefined') {
    if (!window.__ATH_SUPABASE_BROWSER__) {
      window.__ATH_SUPABASE_BROWSER__ = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return window.__ATH_SUPABASE_BROWSER__
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
