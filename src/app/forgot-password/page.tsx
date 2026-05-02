'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        setError(data.error || 'Failed to send reset link')
        return
      }
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mx-auto max-w-md px-4 py-32 font-ubuntu'>
      <div className='rounded-2xl border border-gray-100 bg-white p-8 shadow-sm'>
        <Image
          src='/agrotalent-logo.webp'
          alt=''
          width={48}
          height={48}
          className='mx-auto rounded-full'
        />
        <h1 className='mt-6 text-center text-2xl font-bold text-forest'>
          Reset Password
        </h1>
        {success ? (
          <p className='mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-800'>
            Check your inbox for a reset link.
          </p>
        ) : (
          <form onSubmit={onSubmit} className='mt-6 space-y-4'>
            {error ? <p className='text-sm text-red-600'>{error}</p> : null}
            <Input
              label='Email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type='submit'
              variant='primary'
              loading={loading}
              className='w-full bg-brand py-3 text-white hover:bg-forest'
            >
              Send reset link
            </Button>
          </form>
        )}
        <Link
          href='/signin'
          className='mt-6 block text-center text-sm font-medium text-brand hover:underline'
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
