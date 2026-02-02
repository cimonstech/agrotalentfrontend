'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

const supabase = createSupabaseClient()

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

  useEffect(() => {
    const abortController = new AbortController()
    let mounted = true
    let subscription: any = null
    const AUTH_TIMEOUT_MS = 10000

    const checkUserSafe = async () => {
      if (abortController.signal.aborted || !mounted) return
      const timeoutId = setTimeout(() => {
        if (mounted) {
          setLoading(false)
          router.push('/signin')
        }
      }, AUTH_TIMEOUT_MS)
      try {
        await checkUser()
      } catch (error: any) {
        if (isAbortError(error)) {
          return
        }
        console.error('[DashboardLayout] Auth check error:', error)
        if (mounted) setLoading(false)
      } finally {
        clearTimeout(timeoutId)
      }
    }

    checkUserSafe()
    
    // Listen for auth state changes (logout in other tabs, token expiration, etc.)
    // This listener will fire across all tabs when auth state changes
    try {
      const authStateChange = supabase.auth.onAuthStateChange(async (event, session) => {
        if (abortController.signal.aborted || !mounted) return
        
        try {
          if (event === 'SIGNED_OUT' || !session) {
            // User logged out or session expired - redirect immediately
            if (mounted) {
              setUser(null)
              setProfile(null)
              setLoading(false)
              router.push('/signin')
              router.refresh()
            }
            return
          }
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // User signed in or token refreshed - update state
            if (mounted) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            }
          }
        } catch (error: any) {
          if (!isAbortError(error)) {
            console.error('[DashboardLayout] Auth state change error:', error)
          }
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
      abortController.abort()
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
    (typeof error?.message === 'string' && error.message.includes('signal is aborted'))

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
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
      console.error('Auth check error:', error)
      setLoading(false)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
      } else {
        setProfile(profileData)
      }
      setRoleChecked(true)
    } catch (error) {
      console.error('Profile fetch error:', error)
      setProfile(null)
      setRoleChecked(true)
    }
  }

  const getDashboardPathForRole = (role: string | null | undefined) => {
    const normalized = role || 'graduate'
    if (normalized === 'student') return '/dashboard/graduate'
    return `/dashboard/${normalized}`
  }

  // Determine role from pathname
  const role = pathname.split('/')[2] || 'graduate'

  // Enforce role-based dashboard access after profile loads
  useEffect(() => {
    if (!roleChecked || !profile) return
    const expectedPath = getDashboardPathForRole(profile.role)
    if (!pathname.startsWith(expectedPath)) {
      router.replace(expectedPath)
    }
  }, [roleChecked, profile, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      <DashboardSidebar role={role} profile={profile} />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
