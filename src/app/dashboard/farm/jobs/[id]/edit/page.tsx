'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Job } from '@/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useJobForm } from '@/hooks/useJobForm'
import JobFormUI from '@/components/dashboard/JobFormUI'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'

const supabase = createSupabaseClient()

type FarmOption = {
  id: string
  farm_name: string | null
  full_name: string | null
  farm_location: string | null
}

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const { profile } = useAuthStore()
  const formHook = useJobForm()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [farms, setFarms] = useState<FarmOption[]>([])

  useEffect(() => {
    const loadJob = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error || !data) {
        router.push('/dashboard/farm/jobs')
        return
      }

      if (data.farm_id !== user.id && profile?.role !== 'admin') {
        router.push('/dashboard/farm/jobs')
        return
      }

      const row = data as Job
      setJob(row)
      const { setValue } = formHook.form
      setValue('title', row.title)
      setValue('job_type', row.job_type)
      setValue('location', row.location)
      setValue('address', row.address ?? '')
      setValue('required_qualification', row.required_qualification ?? '')
      setValue(
        'required_institution_type',
        row.required_institution_type ?? undefined
      )
      setValue('required_specialization', row.required_specialization ?? '')
      setValue('required_experience_years', row.required_experience_years ?? 0)
      setValue('salary_min', row.salary_min ?? undefined)
      setValue('salary_max', row.salary_max ?? undefined)
      setValue('salary_currency', row.salary_currency ?? 'GHS')
      setValue('max_applications', row.max_applications ?? undefined)
      setValue('expires_at', row.expires_at ? row.expires_at.split('T')[0] : '')
      formHook.setDescriptionHtml(row.description ?? '')
      formHook.setResponsibilitiesHtml(row.responsibilities ?? '')
      formHook.setRequirementsHtml(row.requirements ?? '')
      setLoading(false)
    }

    void loadJob()

    if (profile?.role === 'admin') {
      supabase
        .from('profiles')
        .select('id, farm_name, full_name, farm_location')
        .eq('role', 'farm')
        .order('farm_name')
        .then(({ data }) => setFarms((data as FarmOption[] | null) ?? []))
    }
  }, [jobId, profile, router, formHook])

  const handleSubmit = async (payload: Record<string, unknown>) => {
    formHook.setIsSubmitting(true)
    formHook.setSubmitError('')

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      formHook.setSubmitSuccess(true)
      setTimeout(() => {
        if (profile?.role === 'admin') {
          router.push('/dashboard/admin/jobs')
        } else {
          router.push('/dashboard/farm/jobs/' + jobId)
        }
      }, 1500)
    } catch (err) {
      formHook.setSubmitError(
        err instanceof Error ? err.message : 'Failed to save job'
      )
      formHook.setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='mx-auto max-w-3xl p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/3 rounded-xl bg-gray-200' />
          <div className='h-64 rounded-2xl bg-gray-100' />
          <div className='h-48 rounded-2xl bg-gray-100' />
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <DashboardPageHeader
        greeting='Edit Job'
        subtitle={job?.title ?? 'Edit job details'}
      />
      <JobFormUI
        mode='edit'
        jobId={jobId}
        profile={profile}
        formHook={formHook}
        onSubmit={handleSubmit}
        farms={farms}
      />
    </div>
  )
}
