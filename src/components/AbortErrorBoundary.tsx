'use client'

import React from 'react'

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; message?: string }
  return (
    e.name === 'AbortError' ||
    (typeof e.message === 'string' && /signal is aborted|aborted without reason/i.test(e.message))
  )
}

/**
 * Catches AbortError from Supabase auth-js (e.g. on reload/unmount) so the
 * Next.js error overlay doesn't show. Renders nothing for AbortError; otherwise
 * shows children or a fallback.
 */
export class AbortErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; isAbort: boolean }
> {
  state = { hasError: false, isAbort: false }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      isAbort: isAbortError(error),
    }
  }

  componentDidCatch(error: unknown) {
    if (isAbortError(error)) {
      // Suppress — don't log, don't show overlay
      return
    }
    console.error('[AbortErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError && this.state.isAbort) {
      return null
    }
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
          <p className="text-gray-600 dark:text-gray-400">Something went wrong. Please refresh.</p>
        </div>
      )
    }
    return this.props.children
  }
}
