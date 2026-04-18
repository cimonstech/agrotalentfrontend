'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'

const supabase = createSupabaseClient()

export default function SignUpPage() {
  const [oauthError, setOauthError] = useState('')

  const handleGoogleSignIn = async () => {
    setOauthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
    if (error) setOauthError(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 py-12 dark:bg-background-dark sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold">Get Started</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your role to create an account
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-md">
          <p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have a Google account? Sign up faster:
          </p>
          {oauthError ? (
            <div
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {oauthError}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            href="/signup/farm"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-6 inline-block rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
              <i className="fas fa-building text-2xl text-primary"></i>
            </div>
            <h3 className="mb-3 text-2xl font-bold">For Employers/Farms</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Find verified agricultural talent for your business or farm operations.
            </p>
            <span className="font-semibold text-primary group-hover:underline">
              Create Employer/Farm Account →
            </span>
          </Link>

          <Link
            href="/signup/graduate"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-6 inline-block rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
              <i className="fas fa-graduation-cap text-2xl text-primary"></i>
            </div>
            <h3 className="mb-3 text-2xl font-bold">For Graduates</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Start your career in modern agriculture with verified opportunities.
            </p>
            <span className="font-semibold text-primary group-hover:underline">
              Create Graduate Account →
            </span>
          </Link>

          <Link
            href="/signup/skilled"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-all hover:border-accent hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-6 inline-block rounded-xl bg-accent/10 p-4 transition-colors group-hover:bg-accent/20">
              <i className="fas fa-hands-helping text-2xl text-accent"></i>
            </div>
            <h3 className="mb-3 text-2xl font-bold">Skilled/Experienced Workers</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Join us with your practical farming experience and skills.
            </p>
            <span className="font-semibold text-accent group-hover:underline">
              Create Skilled Worker Account →
            </span>
          </Link>

          <Link
            href="/signup/student"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-6 inline-block rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
              <i className="fas fa-user-graduate text-2xl text-primary"></i>
            </div>
            <h3 className="mb-3 text-2xl font-bold">For Students</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Find internship and NSS placement opportunities.
            </p>
            <span className="font-semibold text-primary group-hover:underline">
              Create Student Account →
            </span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
