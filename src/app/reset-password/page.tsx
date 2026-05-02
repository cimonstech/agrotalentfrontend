'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import PasswordInput from '@/components/ui/PasswordInput'

const supabase = createSupabaseClient()

function ResetPasswordInner() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState<'checking' | 'ok' | 'invalid'>(
    'checking'
  )

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSessionReady(session ? 'ok' : 'invalid')
    }
    void run()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter a new password')
      return
    }
    if (!confirmPassword.trim()) {
      setError('Please confirm your new password')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      const res = await fetch('/api/auth/clear-reset-flag', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to complete reset')

      setSuccess(true)
      setTimeout(() => router.push('/signin'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (sessionReady === 'checking') {
    return (
      <div className='flex min-h-[40vh] items-center justify-center font-ubuntu'>
        <p className='text-gray-600'>Verifying reset link...</p>
      </div>
    )
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
          Set New Password
        </h1>

        {sessionReady === 'invalid' ? (
          <div className='mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700'>
            This reset link is invalid or has expired.{' '}
            <Link href='/forgot-password' className='font-semibold underline'>
              Request a new one.
            </Link>
          </div>
        ) : success ? (
          <div className='mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-center'>
            <p className='font-semibold text-green-700'>Password updated successfully!</p>
            <p className='mt-1 text-xs text-green-600'>Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            {error ? <p className='text-sm text-red-600'>{error}</p> : null}
            <div>
              <label
                htmlFor='reset-new-password'
                className='mb-1 block text-sm font-medium text-gray-700'
              >
                New password
              </label>
              <PasswordInput
                id='reset-new-password'
                name='password'
                autoComplete='new-password'
                placeholder='Enter your password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor='reset-confirm-password'
                className='mb-1 block text-sm font-medium text-gray-700'
              >
                Confirm new password
              </label>
              <PasswordInput
                id='reset-confirm-password'
                name='confirmPassword'
                autoComplete='new-password'
                placeholder='Confirm your password'
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type='submit'
              variant='primary'
              loading={loading}
              className='w-full bg-brand py-3 text-white hover:bg-forest'
            >
              Update password
            </Button>
          </form>
        )}

        {sessionReady === 'ok' && !success ? (
          <p className='mt-4 text-center text-sm text-gray-400'>
            Complete the form above to reset your password.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-[40vh] items-center justify-center font-ubuntu'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
