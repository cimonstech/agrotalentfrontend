'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DevTokenPage() {
  const [token, setToken] = useState('')

  if (process.env.NODE_ENV === 'production') {
    return <p>Not available</p>
  }

  const getToken = async () => {
    const supabase = createSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setToken(session?.access_token ?? 'No session found')
  }

  return (
    <div style={{ padding: 40 }}>
      <button
        type='button'
        onClick={() => void getToken()}
        style={{
          padding: '10px 20px',
          background: '#1A6B3C',
          color: 'white',
          borderRadius: 8,
        }}
      >
        Get Token
      </button>
      {token ? (
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              fontSize: 12,
              wordBreak: 'break-all',
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
            }}
          >
            {token}
          </p>
          <button
            type='button'
            onClick={() => void navigator.clipboard.writeText(token)}
            style={{ marginTop: 8, padding: '6px 12px' }}
          >
            Copy
          </button>
        </div>
      ) : null}
    </div>
  )
}
