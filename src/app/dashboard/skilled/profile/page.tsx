'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { ProfileEditorShell } from '@/components/dashboard/ProfileEditorShell'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'

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
  const [hasCvDocument, setHasCvDocument] = useState(false)

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
      const [{ data: p }, docsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('documents').select('document_type').eq('user_id', uid),
      ])
      if (cancelled || !p) {
        setLoading(false)
        return
      }
      const prof = p as Profile
      setProfile(prof)
      setEmail(prof.email ?? '')
      setVerified(prof.is_verified ?? false)
      const types = new Set(
        (docsRes.data as { document_type: string }[] | null)?.map(
          (d) => d.document_type
        ) ?? []
      )
      setHasCvDocument(types.has('cv'))
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
    <ProfileEditorShell
      title="Profile"
      subtitle="Show farms your experience and keep your contact details current."
      verified={verified}
      profile={profile}
      hasCvDocument={hasCvDocument}
      documentsHref="/dashboard/skilled/documents"
      details={
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Profile saved.
            </p>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900">Account</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Full name" {...register('full_name')} />
                </div>
                <Input label="Phone" type="tel" {...register('phone')} />
                <Input label="Email" value={email} disabled readOnly />
              </div>
            </Card>

            <Card className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900">Experience</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Years of experience"
                  type="number"
                  {...register('years_of_experience')}
                />
                <Input
                  label="Skills (comma separated)"
                  {...register('skills')}
                />
                <div className="sm:col-span-2">
                  <Textarea
                    label="Experience description"
                    {...register('experience_description')}
                    rows={4}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Previous employer"
                    {...register('previous_employer')}
                  />
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900">Reference</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Reference name" {...register('reference_name')} />
                </div>
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
          </div>

          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </form>
      }
      notifications={
        profile ? (
          <NotificationPreferences profile={profile} />
        ) : (
          <p className="text-sm text-gray-500">Sign in to manage notifications.</p>
        )
      }
      account={<AccountDeletion />}
    />
  )
}
