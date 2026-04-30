'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import JobFormUI from '@/components/dashboard/JobFormUI'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useJobForm } from '@/hooks/useJobForm'

const supabase = createSupabaseClient()

type FarmOption = {
  id: string
  farm_name: string | null
  full_name: string | null
  farm_location: string | null
}

export default function NewJobPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const formHook = useJobForm()
  const [farms, setFarms] = useState<FarmOption[]>([])

  useEffect(() => {
    if (profile?.role === 'admin') {
      supabase
        .from('profiles')
        .select('id, farm_name, full_name, farm_location')
        .eq('role', 'farm')
        .order('farm_name')
        .then(({ data }: { data: FarmOption[] | null; error: unknown }) => setFarms((data as FarmOption[] | null) ?? []))
    }
  }, [profile])

  const handleSubmit = async (payload: Record<string, unknown>) => {
    formHook.setIsSubmitting(true)
    formHook.setSubmitError('')

    try {
      if (profile?.role === 'farm' && profile?.is_verified !== true) {
        throw new Error('Your farm account is under review. You cannot post jobs until verified.')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          farm_id: (payload.farm_id as string) ?? user.id,
          status: 'active',
          application_count: 0,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Failed to save job')
      }

      formHook.setSubmitSuccess(true)
      setTimeout(() => {
        if (profile?.role === 'admin') {
          router.push('/dashboard/admin/jobs')
        } else {
          router.push('/dashboard/farm/jobs')
        }
      }, 1500)
    } catch (err) {
      formHook.setSubmitError(
        err instanceof Error ? err.message : 'Failed to post job'
      )
      formHook.setIsSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <DashboardPageHeader
        greeting='Post a New Job'
        subtitle='Add job details manually, upload a document, or paste text'
      />
      <JobFormUI
        mode='new'
        profile={profile}
        formHook={formHook}
        onSubmit={handleSubmit}
        farms={farms}
      />
    </div>
  )
}
