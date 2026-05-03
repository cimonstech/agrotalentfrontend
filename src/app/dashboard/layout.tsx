'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import { isInvalidRefreshTokenError } from '@/lib/auth-utils'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

const supabase = createSupabaseClient()

const PROFILE_DB_TIMEOUT_MS = 5_000

function raceTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out`))
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      }
    )
  })
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [roleChecked, setRoleChecked] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  /** Single in-flight profile load so checkUser + onAuthStateChange do not race or skip completion. */
  const profileFetchPromiseRef = useRef<Promise<void> | null>(null)
  const lastFetchedUserId = useRef<string | null>(null)
  const unreadCountRequestInFlight = useRef(false)
  const lastUnreadCountFetchAt = useRef(0)
  const hasRedirected = useRef(false)

  useEffect(() => {
    let mounted = true
    let subscription: any = null

    try {
      const authStateChange = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        try {
          if (event === 'INITIAL_SESSION') {
            // INITIAL_SESSION reads from localStorage — no getSession() / no navigator lock.
            // This replaces the old checkUser() + getSession() pattern.
            if (!session) {
              if (mounted) {
                setLoading(false)
                router.push('/signin')
              }
              return
            }
            if (mounted) {
              setUser(session.user)
              await fetchProfile(session.user.id)
              if (mounted) setLoading(false)
            }
            return
          }

          if (event === 'SIGNED_OUT') {
            if (mounted) {
              lastFetchedUserId.current = null
              setUser(null)
              setProfile(null)
              setLoading(false)
              router.push('/signin')
              router.refresh()
            }
            return
          }

          if (!session) return

          if (
            event === 'TOKEN_REFRESHED' &&
            lastFetchedUserId.current === session.user.id
          ) {
            if (mounted) setUser(session.user)
            return
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (mounted) {
              setUser(session.user)
              // Skip redundant fetch if we already have profile for this user
              if (lastFetchedUserId.current !== session.user.id) {
                await fetchProfile(session.user.id)
              }
            }
          }
        } catch (error: any) {
          if (isAbortError(error)) return
          if (isInvalidRefreshTokenError(error)) {
            try {
              await supabase.auth.signOut({ scope: 'local' })
            } catch (_) {}
            if (mounted) {
              lastFetchedUserId.current = null
              setUser(null)
              setProfile(null)
              setLoading(false)
              router.push('/signin')
              router.refresh()
            }
            return
          }
          console.error('[DashboardLayout] Auth state change error:', error)
        }
      })
      subscription = authStateChange.data.subscription
    } catch (error: any) {
      if (!isAbortError(error)) {
        console.error('[DashboardLayout] Failed to set up auth listener:', error)
      }
    }

    return () => {
      mounted = false
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (err) {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAbortError = (error: any) =>
    error?.name === 'AbortError' ||
    (typeof error?.message === 'string' && /signal is aborted|aborted without reason/i.test(error.message))

  const fetchProfile = async (userId: string) => {
    if (profileFetchPromiseRef.current) {
      await profileFetchPromiseRef.current
      return
    }
    const p = (async () => {
      try {
        const _profileResult = await raceTimeout(
          Promise.resolve(
            supabase
              .from('profiles')
              .select(
                'id, role, full_name, email, phone, ' +
                  'farm_name, farm_type, farm_location, ' +
                  'institution_name, institution_type, qualification, specialization, graduation_year, ' +
                  'preferred_region, city, nss_status, years_of_experience'
              )
              .eq('id', userId)
              .single()
          ),
          PROFILE_DB_TIMEOUT_MS,
          'profiles.select'
        ) as { data: Record<string, unknown> | null; error: { message: string } | null }
        const { data: profileData, error } = _profileResult
        if (error || !profileData) {
          console.error('Profile fetch error:', error)
          setProfile(null)
          // Do NOT set roleChecked: keep it false so the role-enforcement
          // effect never runs with a null profile and silently redirects.
          return
        }
        lastFetchedUserId.current = userId
        setProfile(profileData)
        // Only reset hasRedirected if this is a different user
        // Do not reset if we already have profile for same user
        setRoleChecked(true)
      } catch (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
        // Same: do not mark role as checked on failure.
      }
    })()
    profileFetchPromiseRef.current = p
    try {
      await p
    } finally {
      profileFetchPromiseRef.current = null
    }
  }

  const getDashboardPathForRole = (role: string | null | undefined) => {
    const raw = (role ?? 'graduate').toString().trim().toLowerCase()
    const normalized =
      raw === 'farm' ||
      raw === 'graduate' ||
      raw === 'student' ||
      raw === 'skilled' ||
      raw === 'admin'
        ? raw
        : 'graduate'
    if (normalized === 'student') return '/dashboard/student'
    return `/dashboard/${normalized}`
  }

  // Determine role from pathname
  const role = pathname.split('/')[2] || 'graduate'

  // Fetch unread notification count for sidebar badge
  const refreshUnreadCount = (force = false) => {
    if (!user) return
    const now = Date.now()
    const MIN_UNREAD_FETCH_INTERVAL_MS = 15000
    if (
      !force &&
      now - lastUnreadCountFetchAt.current < MIN_UNREAD_FETCH_INTERVAL_MS
    ) {
      return
    }
    if (unreadCountRequestInFlight.current) return
    unreadCountRequestInFlight.current = true
    lastUnreadCountFetchAt.current = now
    fetch('/api/notifications?unread=true', {
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    })
      .then((r) => r.json())
      .then((data) => setUnreadNotificationCount((data.notifications || []).length))
      .catch((err) => {
        if (err.name !== 'TimeoutError' && err.name !== 'AbortError') {
          console.warn('[DashboardLayout] Notification count fetch failed:', err)
        }
      })
      .finally(() => {
        unreadCountRequestInFlight.current = false
      })
  }
  useEffect(() => {
    if (!user) return
    refreshUnreadCount(true)
  }, [user, pathname])
  useEffect(() => {
    const handler = () => refreshUnreadCount()
    window.addEventListener('notifications-updated', handler)
    return () => window.removeEventListener('notifications-updated', handler)
  }, [user])

  // Enforce role-based dashboard access when profile is ready (pathname omitted from deps to avoid redirect loops)
  useEffect(() => {
    if (!roleChecked || !profile) return
    const expectedPath = getDashboardPathForRole(profile.role)
    if (pathname.startsWith(expectedPath)) return
    if (hasRedirected.current) return
    hasRedirected.current = true
    const timer = setTimeout(() => {
      router.replace(expectedPath)
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleChecked, profile])

  if (loading || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='text-center'>
          <i className='fas fa-spinner mb-4 text-4xl text-primary fa-spin'></i>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='font-ubuntu flex min-h-screen bg-[#F5F5F0]'>
      <DashboardSidebar role={role} profile={profile} unreadNotificationCount={unreadNotificationCount} />
      <main className='flex-1 overflow-x-hidden bg-[#F5F5F0] pt-16 lg:pt-0'>
        {children}
      </main>
    </div>
  )
}
