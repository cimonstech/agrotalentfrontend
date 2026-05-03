'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Job, Profile } from '@/types'
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
  const formHookRef = useRef(formHook)
  formHookRef.current = formHook

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        router.push('/signin')
        return
      }

      let effectiveProfile = useAuthStore.getState().profile ?? profile
      if (!effectiveProfile) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (cancelled) return
        if (prof) {
          useAuthStore.getState().setProfile(prof as Profile)
          effectiveProfile = prof as Profile
        }
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (cancelled) return

      if (error || !data) {
        router.push('/dashboard/farm/jobs')
        return
      }

      if (data.farm_id !== user.id && effectiveProfile?.role !== 'admin') {
        router.push('/dashboard/farm/jobs')
        return
      }

      const row = data as Job
      setJob(row)
      const { setValue } = formHookRef.current.form
      setValue('title', row.title)
      setValue('job_type', row.job_type)
      setValue('location', row.location)
      setValue('city', row.city ?? '')
      setValue('address', row.address ?? '')
      setValue('required_qualification', row.required_qualification ?? '')
      setValue(
        'required_institution_type',
        (row.required_institution_type ?? '') as '' | 'university' | 'training_college' | 'any'
      )
      setValue('required_specialization', row.required_specialization ?? '')
      setValue('required_experience_years', row.required_experience_years ?? 0)
      setValue('salary_min', row.salary_min ?? undefined)
      setValue('salary_max', row.salary_max ?? undefined)
      setValue('salary_currency', row.salary_currency ?? 'GHS')
      setValue('max_applications', row.max_applications ?? undefined)
      setValue('expires_at', row.expires_at ? row.expires_at.split('T')[0] : '')
      setValue('contract_type', (row.contract_type ?? '') as '' | 'permanent' | 'contract' | 'seasonal' | 'casual')
      setValue('is_sourced_job', row.is_sourced_job ?? false)
      setValue('source_name', row.source_name ?? '')
      setValue('source_contact', row.source_contact ?? '')
      setValue('source_phone', row.source_phone ?? '')
      setValue('source_email', row.source_email ?? '')
      if (row.source_platform) {
        setValue('source_platform', row.source_platform)
      }
      if (row.source_website) {
        setValue('source_website', row.source_website)
      }
      if (row.source_contact_name) {
        setValue('source_contact_name', row.source_contact_name)
      }
      if (row.source_platform_url) {
        setValue('source_platform_url', row.source_platform_url)
      }
      setValue(
        'application_method',
        (row.application_method === 'external' ? 'external' : 'platform') as 'platform' | 'external'
      )
      setValue('external_apply_url', row.external_apply_url ?? '')
      setValue('accommodation_provided', row.accommodation_provided ?? false)
      setValue('commission_included', row.commission_included ?? false)
      setValue(
        'commission_percentage',
        row.commission_percentage ?? undefined
      )
      formHookRef.current.seedBenefitsFromJob(row)
      formHookRef.current.setAcceptableRegions(row.acceptable_regions ?? [])
      formHookRef.current.setAcceptableCities(row.acceptable_cities ?? [])
      formHookRef.current.setDescriptionHtml(row.description ?? '')
      formHookRef.current.setResponsibilitiesHtml(row.responsibilities ?? '')
      formHookRef.current.setRequirementsHtml(row.requirements ?? '')
      setLoading(false)

      if (effectiveProfile?.role === 'admin') {
        const { data: farmRows } = await supabase
          .from('profiles')
          .select('id, farm_name, full_name, farm_location')
          .eq('role', 'farm')
          .order('farm_name')
        if (cancelled) return
        setFarms((farmRows as FarmOption[] | null) ?? [])
      } else {
        setFarms([])
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [jobId, router, profile?.id, profile?.role])

  const handleSubmit = async (payload: Record<string, unknown>) => {
    formHook.setIsSubmitting(true)
    formHook.setSubmitError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (!payload.farm_id) {
        payload.farm_id = user.id
      }

      console.log('[Edit Job] Payload:', JSON.stringify(payload, null, 2))
      console.log('[Edit Job] farm_id:', payload.farm_id)
      console.log('[Edit Job] user.id:', user.id)

      const { error } = await supabase
        .from('jobs')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

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
