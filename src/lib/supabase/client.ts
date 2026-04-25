import { createBrowserClient } from '@supabase/ssr'
import type { LockFunc } from '@supabase/auth-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let clientInstance: SupabaseClient | null = null

/**
 * Serialize auth critical sections in-process. The default Web Locks implementation
 * can throw "Lock was released because another request stole it" when React Strict
 * Mode runs effects twice or many auth calls overlap (dev). Production keeps the
 * default navigator lock for multi-tab coordination.
 */
let authLockChain: Promise<void> = Promise.resolve()

const authInProcessLock: LockFunc = <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  const prev = authLockChain
  let release!: () => void
  authLockChain = new Promise<void>((resolve) => {
    release = resolve
  })
  return (async () => {
    await prev
    try {
      return await fn()
    } finally {
      release()
    }
  })()
}

export const createSupabaseClient = (): SupabaseClient => {
  if (!clientInstance) {
    const isDev = process.env.NODE_ENV !== 'production'
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      isDev
        ? {
            auth: {
              lock: authInProcessLock,
            },
          }
        : undefined
    )
  }
  return clientInstance
}
