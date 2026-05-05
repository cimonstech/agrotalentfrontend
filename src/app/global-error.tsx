'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset?: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const stack = error?.stack ?? ''
  const message = error?.message ?? ''
  const isExtensionStackOverflow =
    message.includes('Maximum call stack size exceeded') ||
    stack.includes('chrome-extension://')

  useEffect(() => {
    if (!isExtensionStackOverflow) {
      Sentry.captureException(error)
    }
  }, [error, isExtensionStackOverflow])

  return (
    <html lang='en'>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: '10px', color: '#4b5563', lineHeight: 1.5 }}>
              {isExtensionStackOverflow
                ? 'A browser extension triggered a script recursion error. You can try again or reload without extensions enabled for this site.'
                : 'An unexpected error occurred while rendering this page. Please try again.'}
            </p>
            <div style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type='button'
                onClick={() => {
                  if (typeof reset === 'function') reset()
                }}
                style={{
                  border: '1px solid #16a34a',
                  background: '#16a34a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                type='button'
                onClick={() => {
                  window.location.reload()
                }}
                style={{
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#111827',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
