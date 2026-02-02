'use client'

import { useEffect } from 'react'

/**
 * Suppresses AbortError / "signal is aborted" from unhandledrejection so they
 * don't show the Next.js error overlay. These often come from Supabase auth-js
 * (e.g. locks.js) when sign-out or auth listener unsubscribe aborts in-flight work.
 */
export function AbortErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event?.reason
      if (!reason) return
      const name = reason?.name
      const msg = typeof reason?.message === 'string' ? reason.message : ''
      const code = reason?.code
      const isAbort =
        name === 'AbortError' ||
        /signal is aborted|aborted without reason/i.test(msg)
      const isInvalidRefresh =
        code === 'refresh_token_not_found' ||
        /refresh token not found|invalid refresh token/i.test(msg)
      if (isAbort || isInvalidRefresh) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    // Capture phase so we run before Next.js dev overlay listener
    window.addEventListener('unhandledrejection', handler, true)
    return () => window.removeEventListener('unhandledrejection', handler, true)
  }, [])
  return null
}
