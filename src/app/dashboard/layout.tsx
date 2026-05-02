'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import { isInvalidRefreshTokenError } from '@/lib/auth-utils'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

const supabase = createSupabaseClient()

const SESSION_TIMEOUT_MS = 5_000
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
    const abortController = new AbortController()
    let mounted = true
    let subscription: any = null

    const checkUserSafe = async () => {
      if (abortController.signal.aborted || !mounted) return
      try {
        await checkUser()
      } catch (error: any) {
        if (isAbortError(error)) return
        console.error('[DashboardLayout] Auth check error:', error)
        if (mounted) setLoading(false)
      }
    }

    checkUserSafe()

    try {
      const authStateChange = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (abortController.signal.aborted || !mounted) return
        
        try {
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
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (mounted) {
              setUser(session.user)
              // Skip redundant fetch if we already have profile for this user (e.g. from initial checkUser)
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
      // Do not call abortController.abort() - it can trigger AbortError in Supabase auth-js (locks.js) on reload
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (err) {
          // Ignore unsubscribe errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isAbortError = (error: any) =>
    error?.name === 'AbortError' ||
    (typeof error?.message === 'string' && /signal is aborted|aborted without reason/i.test(error.message))

  const checkUser = async () => {
    try {
      const _sessionResult = await raceTimeout(
        supabase.auth.getSession(),
        SESSION_TIMEOUT_MS,
        'getSession'
      ) as { data: { session: Session | null }; error: { message: string } | null }
      const { data: { session }, error } = _sessionResult

      if (error) throw error

      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }

      setUser(session.user)
      await fetchProfile(session.user.id)
    } catch (error: any) {
      if (isAbortError(error)) {
        setLoading(false)
        return
      }
      // Invalid/revoked refresh token: clear local session and redirect (no need to log)
      if (isInvalidRefreshTokenError(error)) {
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (_) {
          // Ignore signOut errors
        }
        setLoading(false)
        router.push('/signin')
        return
      }
      console.error('Auth check error:', error)
      setLoading(false)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

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
        hasRedirected.current = false
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

  // Enforce role-based dashboard access after profile loads (preserve path when redirecting e.g. student -> graduate/notices/123)
  useEffect(() => {
    if (!roleChecked || !profile) return
    const expectedPath = getDashboardPathForRole(profile.role)
    if (pathname.startsWith(expectedPath)) return
    if (hasRedirected.current) return
    hasRedirected.current = true
    const segment = pathname.split('/')[2]
    const currentPrefix = segment ? '/dashboard/' + segment : ''
    const suffix =
      currentPrefix && pathname.startsWith(currentPrefix)
        ? pathname.slice(currentPrefix.length)
        : ''
    router.replace(expectedPath + (suffix || ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleChecked, profile, pathname])

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
