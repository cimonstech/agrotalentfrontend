'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { getInitials, cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

/** Label for avatar before / after profile API — avoids empty string → "?" initials. */
function displayNameFromUser(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const metaName =
    typeof meta?.full_name === 'string' ? meta.full_name.trim() : ''
  if (metaName) return metaName
  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0]!.trim() || 'Account'
  }
  return 'Account'
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const hideBrandImage = pathname?.startsWith('/signup') ?? false
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dashboardHref, setDashboardHref] = useState('/dashboard/graduate')
  const [accountLabel, setAccountLabel] = useState('')
  const accountWrapRef = useRef<HTMLDivElement>(null)
  const cachedProfile = useAuthStore((s) => s.profile)

  const accountDisplayName = useMemo(() => {
    const p = cachedProfile
    if (p?.role === 'farm') {
      const farm = p.farm_name?.trim()
      if (farm) return farm
    }
    const fromProfile = p?.full_name?.trim()
    if (fromProfile) return fromProfile
    return accountLabel
  }, [cachedProfile, accountLabel])

  const getDashboardHrefForRole = (role: string | null | undefined) => {
    if (!role) return '/dashboard/graduate'
    if (role === 'student') return '/dashboard/student'
    return `/dashboard/${role}`
  }

  const applySession = (session: { user: { user_metadata?: unknown; app_metadata?: unknown; email?: string } } | null) => {
    if (!session?.user) {
      setIsAuthenticated(false)
      setDashboardHref('/dashboard/graduate')
      setAccountLabel('')
      return
    }
    setIsAuthenticated(true)
    setAccountLabel(displayNameFromUser(session.user as Parameters<typeof displayNameFromUser>[0]))
    const role =
      (session.user.app_metadata as Record<string, unknown> | undefined)?.role as string | undefined ||
      (session.user.user_metadata as Record<string, unknown> | undefined)?.role as string | undefined ||
      null
    setDashboardHref(getDashboardHrefForRole(role))
  }

  useEffect(() => {
    const supabase = createSupabaseClient()
    let mounted = true

    // INITIAL_SESSION fires from localStorage — no getSession() / no navigator lock.
    // It is always the first event emitted by onAuthStateChange, giving us the
    // current session without a network round-trip.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return
      applySession(session)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const onDocClick = (e: MouseEvent) => {
      const el = accountWrapRef.current
      if (el && !el.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [accountOpen])

  const handleSignOut = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut().catch(() => {})
    useAuthStore.getState().clear()
    localStorage.removeItem('ath:lastRole')
    setIsAuthenticated(false)
    setMobileOpen(false)
    setAccountOpen(false)
    router.push('/signin')
    router.refresh()
  }

  useEffect(() => {
    const html = document.documentElement
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      html.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      html.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      html.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [pathname])

  const isAuthFlowPage =
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email' ||
    (pathname?.startsWith('/auth') ?? false)

  /** On sign-in/up and password recovery, show guest chrome. Recovery links create a Supabase session, but dashboard should stay hidden until sign-in completes. */
  const showAccountChrome = isAuthenticated && !isAuthFlowPage

  const initials = getInitials(
    accountDisplayName.trim() ? accountDisplayName : 'Account'
  )

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-2 shadow-sm sm:px-4"
          >
            {hideBrandImage ? null : (
              <Image
                src="/agrotalent-logo.webp"
                alt=""
                width={28}
                height={28}
              />
            )}
            <span className="font-ubuntu truncate text-sm font-bold text-forest">
              AgroTalent Hub
            </span>
          </Link>

          <nav
            className="hidden flex-1 justify-center lg:flex"
            aria-label="Primary"
          >
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href
                const linkClass = active
                  ? 'rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-forest'
                  : 'rounded-full px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-100 hover:text-forest'
                return (
                  <Link key={href} href={href} className={linkClass}>
                    {label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showAccountChrome ? (
              <div className="relative" ref={accountWrapRef}>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
                    'border-0 bg-transparent p-0 lg:gap-2 lg:border lg:border-gray-200 lg:bg-white lg:px-3 lg:py-1.5 lg:shadow-sm lg:hover:bg-gray-50'
                  )}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <span className="sr-only">Account menu</span>
                  <span className="hidden text-sm font-semibold text-forest lg:inline">
                    Dashboard
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white shadow-sm ring-2 ring-white lg:h-8 lg:w-8 lg:text-[11px]">
                    {initials}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-gray-600 transition-transform',
                      accountOpen ? 'rotate-180' : ''
                    )}
                    aria-hidden
                  />
                </button>
                {accountOpen ? (
                  <div
                    className="absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    role="menu"
                  >
                    <Link
                      href={dashboardHref}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      role="menuitem"
                      onClick={() => void handleSignOut()}
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 lg:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-forest transition-colors hover:bg-gold/90"
                >
                  Register
                </Link>
              </>
            )}
            <button
              type="button"
              className="p-2 text-black lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <rect y="4" width="20" height="2" rx="1" fill="currentColor" />
                <rect y="10" width="20" height="2" rx="1" fill="currentColor" />
                <rect y="16" width="20" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            role="presentation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed bottom-0 right-0 top-0 z-50 flex h-full max-h-[100dvh] w-72 flex-col bg-forest p-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              className="absolute right-6 top-6 text-white"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="mt-8 mb-6 flex items-center gap-2">
              {hideBrandImage ? null : (
                <Image
                  src="/agrotalent-logo.webp"
                  alt=""
                  width={28}
                  height={28}
                />
              )}
              <span className="font-bold text-white">AgroTalent Hub</span>
            </div>

            <nav
              className="flex min-h-0 flex-1 flex-col overflow-y-auto"
              aria-label="Mobile"
            >
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="border-b border-white/10 py-3 text-base font-medium text-white/80 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
              {showAccountChrome ? (
                <>
                  <p className="truncate text-xs text-white/60">
                    Signed in as{' '}
                    <span className="font-medium text-white/90">
                      {accountDisplayName || '—'}
                    </span>
                  </p>
                  <Link
                    href={dashboardHref}
                    className="rounded-lg border border-white/25 py-2.5 text-center text-sm font-medium text-white hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    Open dashboard
                  </Link>
                  <button
                    type="button"
                    className="py-2 text-center text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
                    onClick={() => void handleSignOut()}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="rounded-full border border-white/30 py-3 text-center text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-gold py-3 text-center font-bold text-forest"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}

export { Navigation }
