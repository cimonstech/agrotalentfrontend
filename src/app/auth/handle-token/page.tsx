'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

const supabase = createSupabaseClient()

export default function HandleTokenPage() {
  const router = useRouter()

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash
      if (!hash) {
        router.replace('/auth/error')
        return
      }

      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (!accessToken || !refreshToken) {
        router.replace('/auth/error')
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error('Handle token error:', error)
        router.replace('/auth/error')
        return
      }

      if (type === 'recovery') {
        router.replace('/reset-password')
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          const roleRoutes: Record<string, string> = {
            farm: '/dashboard/farm',
            graduate: '/dashboard/graduate',
            student: '/dashboard/student',
            skilled: '/dashboard/skilled',
            admin: '/dashboard/admin',
          }
          const roleKey =
            typeof profile?.role === 'string' ? profile.role : ''
          router.replace(roleRoutes[roleKey] ?? '/auth/complete-profile')
        } else {
          router.replace('/auth/complete-profile')
        }
      }
    }

    void handleHash()
  }, [router])

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent' />
        <p className='text-sm text-gray-500'>Processing...</p>
      </div>
    </div>
  )
}
