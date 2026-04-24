'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type FormValues = {
  full_name: string
  phone: string
  years_of_experience: string
  experience_description: string
  skills: string
  previous_employer: string
  reference_name: string
  reference_phone: string
  reference_relationship: string
}

export default function SkilledProfilePage() {
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
      years_of_experience: '',
      experience_description: '',
      skills: '',
      previous_employer: '',
      reference_name: '',
      reference_phone: '',
      reference_relationship: '',
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
        years_of_experience:
          prof.years_of_experience != null
            ? String(prof.years_of_experience)
            : '',
        experience_description: prof.experience_description ?? '',
        skills: prof.skills ?? '',
        previous_employer: prof.previous_employer ?? '',
        reference_name: prof.reference_name ?? '',
        reference_phone: prof.reference_phone ?? '',
        reference_relationship: prof.reference_relationship ?? '',
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
    const y = values.years_of_experience.trim()
    const payload = {
      full_name: values.full_name.trim() || null,
      phone: values.phone.trim() || null,
      years_of_experience: y ? parseInt(y, 10) : null,
      experience_description: values.experience_description.trim() || null,
      skills: values.skills.trim() || null,
      previous_employer: values.previous_employer.trim() || null,
      reference_name: values.reference_name.trim() || null,
      reference_phone: values.reference_phone.trim() || null,
      reference_relationship: values.reference_relationship.trim() || null,
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
              <Input label="Full name" {...register('full_name')} />
              <Input label="Phone" type="tel" {...register('phone')} />
              <Input label="Email" value={email} disabled readOnly />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Experience</h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Years of experience"
                type="number"
                {...register('years_of_experience')}
              />
              <Textarea
                label="Experience description"
                {...register('experience_description')}
                rows={4}
              />
              <Input
                label="Skills (comma separated)"
                {...register('skills')}
              />
              <Input
                label="Previous employer"
                {...register('previous_employer')}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Reference</h2>
            <div className="mt-4 space-y-4">
              <Input label="Reference name" {...register('reference_name')} />
              <Input
                label="Reference phone"
                {...register('reference_phone')}
              />
              <Input
                label="Reference relationship"
                {...register('reference_relationship')}
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
