'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const supabase = createSupabaseClient()

function ResetPasswordInner() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1))
      const access = params.get('access_token')
      const refresh = params.get('refresh_token')
      if (access && refresh) {
        void supabase.auth
          .setSession({
            access_token: access,
            refresh_token: refresh,
          })
          .then(() => {
            setReady(true)
            window.history.replaceState(null, '', window.location.pathname)
          })
        return
      }
    }
    setReady(true)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    await supabase.auth.signOut()
    router.push('/signin')
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-ubuntu">
        <p className="text-gray-600">Preparing...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-32 font-ubuntu">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <Image
          src="/agrotalent-logo.webp"
          alt=""
          width={48}
          height={48}
          className="mx-auto rounded-full"
        />
        <h1 className="mt-6 text-center text-2xl font-bold text-forest">
          Set New Password
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full bg-brand py-3 text-white hover:bg-forest"
          >
            Update password
          </Button>
        </form>
        <Link
          href="/signin"
          className="mt-6 block text-center text-sm text-brand hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center font-ubuntu">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
