'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const supabase = createSupabaseClient()

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6h16v12H4V6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const urlEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(urlEmail)
  const [showField, setShowField] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function resend() {
    const trimmed = email.trim()
    if (!trimmed) {
      setMsg('Enter your email address.')
      return
    }
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
    })
    setLoading(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setMsg('Verification email sent again.')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-32 text-center font-ubuntu">
      <EnvelopeIcon className="mx-auto h-20 w-20 text-brand" />
      <h1 className="mt-6 text-3xl font-bold text-forest">Check Your Email</h1>
      <p className="mt-4 text-gray-500">
        We sent a verification link. Open it to activate your account.
      </p>
      <Link href="/signin" className="mt-8 inline-block font-semibold text-brand hover:underline">
        Back to Sign In
      </Link>
      <div className="mt-10 border-t border-gray-100 pt-8">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowField(true)}
        >
          Resend verification email
        </Button>
        {showField ? (
          <div className="mt-4 text-left">
            <label htmlFor="resend-email" className="mb-1 block text-sm text-gray-600">
              Email
            </label>
            <input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="primary"
              className="mt-3 w-full bg-brand hover:bg-forest"
              loading={loading}
              onClick={() => void resend()}
            >
              Send
            </Button>
          </div>
        ) : null}
        {msg ? <p className="mt-4 text-sm text-gray-700">{msg}</p> : null}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center font-ubuntu">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  )
}
