'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Check if user came from email verification link
    const token = searchParams.get('token')
    const verified = searchParams.get('verified')
    const hash = window.location.hash
    
    // Handle Supabase redirect format (access_token in hash)
    if (hash && hash.includes('access_token=')) {
      // Extract access_token and type from hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (accessToken && (type === 'signup' || type === 'email')) {
        verifyEmail(accessToken)
        return
      }
    } else if (token) {
      // Handle token in query params
      verifyEmail(token)
    } else if (verified === 'true') {
      // Already verified
      setSuccess(true)
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    }
  }, [searchParams, router])

  const verifyEmail = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      // Use Supabase client to verify the token
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Check if email is already verified by checking current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession?.user?.email_confirmed_at) {
        // Email is already verified
        setSuccess(true)
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
        return
      }

      // If token looks like an access_token (long string, typically 200+ chars), set session
      // Supabase verification links use access_token in the hash
      if (token.length > 100) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '', // Not needed for email verification
        })

        if (sessionError) {
          // If setting session fails, the token might be expired or invalid
          // Check if user can sign in (email might already be verified)
          throw new Error(sessionError.message || 'Verification link is invalid or expired. Your email may already be verified - try signing in.')
        }

        if (sessionData.user) {
          // Check if email is now confirmed
          if (sessionData.user.email_confirmed_at) {
            setSuccess(true)
            setTimeout(() => {
              router.push('/signin')
            }, 2000)
            return
          } else {
            // Session created but email not confirmed - this shouldn't happen with verification links
            throw new Error('Email verification incomplete. Please try the link again or request a new verification email.')
          }
        }
      } else {
        // Token is too short to be an access_token, try OTP verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        })

        if (error) throw error

        if (data.user) {
          setSuccess(true)
          setTimeout(() => {
            router.push('/signin')
          }, 2000)
        }
      }
    } catch (err: any) {
      // If error mentions "already verified" or user can sign in, show helpful message
      if (err.message?.includes('already verified') || err.message?.includes('Email not confirmed') === false) {
        setError('Your email appears to already be verified. You can sign in now.')
        setTimeout(() => {
          router.push('/signin')
        }, 3000)
      } else {
        setError(err.message || 'Failed to verify email. The link may have expired. If you can sign in, your email is already verified.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-primary rounded-lg text-white">
              <i className="fas fa-envelope text-2xl"></i>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#101914] dark:text-white">
            {success ? 'Email Verified!' : 'Verify Your Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {success 
              ? 'Your email has been verified. Redirecting to sign in...'
              : 'Please check your email and click the verification link'
            }
          </p>
        </div>

        <div className="mt-8 space-y-6 bg-white dark:bg-background-dark p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm text-center">
              <i className="fas fa-check-circle text-2xl mb-2"></i>
              <p className="font-medium">Verification successful!</p>
              <p className="text-sm mt-1">You can now sign in to your account.</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="bg-primary/10 p-6 rounded-lg">
                  <i className="fas fa-envelope-open text-4xl text-primary mb-4"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent a verification link to:
                  </p>
                  {email && (
                    <p className="font-medium text-gray-900 dark:text-white mt-2">{email}</p>
                  )}
                </div>

                <div className="text-left bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Next steps:</p>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>You'll be redirected to sign in</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="w-full py-3 px-4 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sending...
                    </span>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>

                <div className="text-center">
                  <Link href="/signin" className="text-sm font-medium text-primary hover:text-primary/80">
                    Already verified? Sign in →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
