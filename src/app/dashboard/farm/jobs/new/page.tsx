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
        .then(({ data }) => setFarms((data as FarmOption[] | null) ?? []))
    }
  }, [profile])

  const handleSubmit = async (payload: Record<string, unknown>) => {
    formHook.setIsSubmitting(true)
    formHook.setSubmitError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('jobs')
        .insert({
          ...payload,
          farm_id: (payload.farm_id as string) ?? user.id,
          status: 'active',
          application_count: 0,
          created_at: new Date().toISOString(),
        })

      if (error) {
        const detail = [error.message, error.hint, (error as { details?: string }).details]
          .filter(Boolean)
          .join(' ')
        throw new Error(detail || 'Failed to save job')
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
