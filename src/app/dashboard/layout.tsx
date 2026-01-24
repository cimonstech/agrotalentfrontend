'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      setUser(session.user)

      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

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

  // Determine role from pathname
  const role = pathname.split('/')[2] || 'graduate'

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      <DashboardSidebar role={role} profile={profile} />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
