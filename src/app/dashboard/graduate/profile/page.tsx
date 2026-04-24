'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { GHANA_REGIONS } from '@/lib/utils'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type FormValues = {
  full_name: string
  phone: string
  institution_name: string
  institution_type: string
  qualification: string
  specialization: string
  graduation_year: string
  preferred_region: string
  nss_status: string
}

const regionOptions = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

export default function GraduateProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      full_name: '',
      phone: '',
      institution_name: '',
      institution_type: '',
      qualification: '',
      specialization: '',
      graduation_year: '',
      preferred_region: '',
      nss_status: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        setLoading(false)
        return
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled || !p) {
        setLoading(false)
        return
      }
      const prof = p as Profile
      setProfile(prof)
      setEmail(prof.email ?? '')
      setVerified(prof.is_verified ?? false)
      reset({
        full_name: prof.full_name ?? '',
        phone: prof.phone ?? '',
        institution_name: prof.institution_name ?? '',
        institution_type: prof.institution_type ?? '',
        qualification: prof.qualification ?? '',
        specialization: prof.specialization ?? '',
        graduation_year:
          prof.graduation_year != null ? String(prof.graduation_year) : '',
        preferred_region: prof.preferred_region ?? '',
        nss_status: prof.nss_status ?? '',
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [reset])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    setSuccess(false)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('You must be signed in.')
      setSaving(false)
      return
    }
    const gy = values.graduation_year.trim()
    const payload = {
      full_name: values.full_name.trim() || null,
      phone: values.phone.trim() || null,
      institution_name: values.institution_name.trim() || null,
      institution_type: values.institution_type.trim() || null,
      qualification: values.qualification.trim() || null,
      specialization: values.specialization.trim() || null,
      graduation_year: gy ? parseInt(gy, 10) : null,
      preferred_region: values.preferred_region.trim() || null,
      nss_status: values.nss_status.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: uErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', uid)
    setSaving(false)
    if (uErr) {
      setError(uErr.message)
      return
    }
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (refreshed) setProfile(refreshed as Profile)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-10">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="mt-2">
          {verified ? (
            <Pill variant="green">Verified</Pill>
          ) : (
            <Pill variant="yellow">Pending Verification</Pill>
          )}
        </div>

        {profile ? (
          <Card className="mb-6" padding="none">
            <ProfileStrength profile={profile} />
          </Card>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Profile saved.
            </p>
          ) : null}

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Full name"
                {...register('full_name')}
              />
              <Input label="Phone" type="tel" {...register('phone')} />
              <Input label="Email" value={email} disabled readOnly />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Education</h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Institution name"
                {...register('institution_name')}
              />
              <Select
                label="Institution type"
                {...register('institution_type')}
                options={[
                  { value: '', label: 'Select' },
                  { value: 'university', label: 'University' },
                  {
                    value: 'training_college',
                    label: 'Training college',
                  },
                ]}
              />
              <Input
                label="Qualification"
                {...register('qualification')}
              />
              <Select
                label="Specialization"
                {...register('specialization')}
                options={[
                  { value: '', label: 'Select' },
                  { value: 'crop', label: 'Crop' },
                  { value: 'livestock', label: 'Livestock' },
                  { value: 'agribusiness', label: 'Agribusiness' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input
                label="Graduation year"
                type="number"
                {...register('graduation_year')}
              />
              <Select
                label="Preferred region"
                {...register('preferred_region')}
                options={[
                  { value: '', label: 'Select region' },
                  ...regionOptions,
                ]}
              />
              <Select
                label="NSS status"
                {...register('nss_status')}
                options={[
                  { value: '', label: 'Select' },
                  { value: 'not_applicable', label: 'Not applicable' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </Card>

          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </form>

        <div className='mt-8'>
          <h2 className='font-bold text-lg text-gray-900 mb-4'>Notification Preferences</h2>
          {profile && <NotificationPreferences profile={profile} />}
        </div>

        <div className='mt-8 pt-8 border-t border-gray-100'>
          <h2 className='font-bold text-lg text-gray-900 mb-4'>Account</h2>
          <AccountDeletion />
        </div>
      </div>
    </div>
  )
}
