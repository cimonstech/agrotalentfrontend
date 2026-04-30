'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Profile, UserRole } from '@/types'

const supabase = createSupabaseClient()

const signinSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type SigninValues = z.infer<typeof signinSchema>

const dashboardByRole: Record<UserRole, string> = {
  farm: '/dashboard/farm',
  graduate: '/dashboard/graduate',
  student: '/dashboard/student',
  skilled: '/dashboard/skilled',
  admin: '/dashboard/admin',
}

function resolveRoleFromAuth(user: {
  user_metadata?: unknown
  app_metadata?: unknown
}): UserRole | null {
  const userMeta =
    user.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as Record<string, unknown>)
      : null
  const appMeta =
    user.app_metadata && typeof user.app_metadata === 'object'
      ? (user.app_metadata as Record<string, unknown>)
      : null
  const role =
    (typeof userMeta?.role === 'string' && userMeta.role) ||
    (typeof appMeta?.role === 'string' && appMeta.role) ||
    null
  if (!role) return null
  return role in dashboardByRole ? (role as UserRole) : null
}

const SIGNIN_ROLE_CACHE_KEY = 'ath:lastRole'

function readCachedRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const cached = window.localStorage.getItem(SIGNIN_ROLE_CACHE_KEY)
  if (!cached) return null
  return cached in dashboardByRole ? (cached as UserRole) : null
}

function writeCachedRole(role: UserRole) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SIGNIN_ROLE_CACHE_KEY, role)
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState('')

  const handleGoogleSignIn = async () => {
    setFormError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
    if (error) setFormError(error.message)
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: SigninValues) => {
    setFormError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setFormError(error.message)
        return
      }

      if (!data.user) {
        setFormError('Sign in failed. Please try again.')
        return
      }

      const redirect = searchParams.get('redirect')
      if (redirect) {
        window.location.href = redirect
        return
      }

      // Fast path: role is commonly available in auth metadata.
      const roleFromAuth = resolveRoleFromAuth(data.user)
      let resolvedRole: UserRole | null = roleFromAuth
      if (!resolvedRole) {
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          setFormError(profileError.message)
          return
        }

        const profile = profileRow as Pick<Profile, 'role'> | null
        resolvedRole = (profile?.role as UserRole | undefined) ?? null
      }

      if (!resolvedRole) {
        setFormError('No profile found for this account. Contact support.')
        return
      }
      localStorage.removeItem('ath:lastRole')
      writeCachedRole(resolvedRole)

      const dest = dashboardByRole[resolvedRole]
      if (!dest) {
        setFormError('Unknown account role.')
        return
      }

      window.location.href = dest
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign in failed'
      setFormError(msg)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-cream px-4 py-12 font-ubuntu">
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[440px] space-y-8">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-gold/35 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bark">
            Welcome back
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-forest md:text-4xl">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Access your dashboard and manage placements in one place.
          </p>
        </div>

        <Card
          padding="lg"
          className="rounded-2xl border border-gray-200/90 shadow-[0_4px_28px_rgba(13,51,32,0.07)] ring-1 ring-black/[0.03]"
        >
          <div
            className="-mx-6 -mt-6 mb-6 h-1 rounded-t-2xl bg-gradient-to-r from-gold via-brand to-forest sm:-mx-8 sm:-mt-8"
            aria-hidden
          />

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 py-3 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
            Continue with Google
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 font-medium text-gray-400">
                or continue with email
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {formError ? (
              <div
                className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              className="rounded-xl border-gray-200 bg-gray-50/80 py-2.5 transition-colors placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              className="rounded-xl border-gray-200 bg-gray-50/80 py-2.5 transition-colors placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full rounded-xl bg-brand py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-forest hover:shadow-lg focus-visible:ring-brand"
              loading={isSubmitting}
              size="lg"
            >
              Sign in
            </Button>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <Link
                  href="/forgot-password"
                  className="text-center text-sm font-semibold text-brand transition-colors hover:text-forest sm:text-left"
                >
                  Forgot password?
                </Link>
                <Link
                  href="/signup"
                  className="text-center text-sm font-semibold text-brand transition-colors hover:text-forest sm:text-right"
                >
                  Create an account
                </Link>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500">
                New to AgroTalent Hub?{' '}
                <Link href="/signup" className="font-semibold text-forest underline-offset-2 hover:underline">
                  Join as a farm or graduate
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    // If we have a cached role, reduce the session-check wait so the form
    // appears almost instantly if there is no active session.
    const cachedRole = readCachedRole()
    const SESSION_CHECK_TIMEOUT_MS = cachedRole ? 400 : 1200
    ;(async () => {
      try {
        const sessionResult = await Promise.race<
          | { data: { session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] } }
          | null
        >([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_CHECK_TIMEOUT_MS)),
        ])
        const session = sessionResult?.data?.session ?? null
        if (!mounted || !session?.user) return
        // Prefer role from JWT metadata, then cached value — avoids a DB round-trip.
        const r = resolveRoleFromAuth(session.user) ?? cachedRole
        if (r) {
          writeCachedRole(r)
          if (window.location.pathname !== dashboardByRole[r]) {
            window.location.href = dashboardByRole[r]
          }
          return
        }
        // Last resort: fetch from DB only when no role info is available anywhere.
        const { data: row } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        const dbRole = (row?.role as UserRole | undefined) ?? null
        if (dbRole && mounted) {
          writeCachedRole(dbRole)
          router.replace(dashboardByRole[dbRole])
        }
      } finally {
        if (mounted) setChecking(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 bg-cream font-ubuntu text-forest">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
        <p className="text-sm text-gray-600">Checking your session…</p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 bg-cream font-ubuntu">
          <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
          <p className="text-sm text-gray-600">Loading…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
