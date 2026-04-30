import { createBrowserClient } from '@supabase/ssr'
import type { LockFunc } from '@supabase/auth-js'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

type BrowserCookie = {
  name: string
  value: string
}

const getBrowserCookies = (): BrowserCookie[] => {
  if (typeof document === 'undefined' || !document.cookie) {
    return []
  }

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf('=')
      if (separatorIndex < 0) {
        return { name: cookie, value: '' }
      }

      return {
        name: cookie.slice(0, separatorIndex),
        value: cookie.slice(separatorIndex + 1),
      }
    })
}

let authLockChain: Promise<void> = Promise.resolve()

const authInProcessLock: LockFunc = <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  const previous = authLockChain
  let release: () => void = () => undefined
  authLockChain = new Promise<void>((resolve) => {
    release = resolve
  })

  return (async () => {
    await previous
    try {
      return await fn()
    } finally {
      release()
    }
  })()
}

export const createSupabaseClient = (): ReturnType<typeof createBrowserClient> => {
  if (!clientInstance) {
    const clientOptions = {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        lock: authInProcessLock,
      },
      cookies: {
        getAll() {
          return getBrowserCookies()
        },
        setAll(cookiesToSet: Array<{
          name: string
          value: string
          options?: {
            domain?: string
            path?: string
            expires?: string | number | Date
            maxAge?: number
            secure?: boolean
            httpOnly?: boolean
            sameSite?: 'lax' | 'strict' | 'none'
          }
        }>) {
          if (typeof document === 'undefined') {
            return
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            const parts = [`${name}=${value}`]

            if (options?.path) {
              parts.push(`Path=${options.path}`)
            } else {
              parts.push('Path=/')
            }

            if (options?.domain) {
              parts.push(`Domain=${options.domain}`)
            }

            if (options?.maxAge !== undefined) {
              parts.push(`Max-Age=${options.maxAge}`)
            }

            if (options?.expires) {
              const expires =
                options.expires instanceof Date
                  ? options.expires.toUTCString()
                  : new Date(options.expires).toUTCString()
              parts.push(`Expires=${expires}`)
            }

            if (options?.secure) {
              parts.push('Secure')
            }

            if (options?.sameSite) {
              parts.push(`SameSite=${options.sameSite}`)
            }

            document.cookie = parts.join('; ')
          })
        },
        lockTimeout: 5000,
      },
    } as unknown as Parameters<typeof createBrowserClient>[2]

    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientOptions
    )
  }
  return clientInstance
}
