'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { GHANA_REGIONS, GHANA_CITIES } from '@/lib/locations'
import { ProfileEditorShell } from '@/components/dashboard/ProfileEditorShell'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'

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
  city: string
  nss_status: string
}

const regionOptions = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

export default function StudentProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hasCvDocument, setHasCvDocument] = useState(false)
  const [hasCertificateDocument, setHasCertificateDocument] = useState(false)
  const [hasSupportingDocuments, setHasSupportingDocuments] = useState(false)
  const [preferredRegions, setPreferredRegions] = useState<string[]>([])

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      full_name: '',
      phone: '',
      institution_name: '',
      institution_type: '',
      qualification: '',
      specialization: '',
      graduation_year: '',
      preferred_region: '',
      city: '',
      nss_status: '',
    },
  })

  const selectedRegion = watch('preferred_region')

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
      setHasCertificateDocument(types.has('certificate'))
      setHasSupportingDocuments(
        types.has('transcript') || types.has('nss_letter')
      )
      setPreferredRegions(prof.preferred_regions ?? [])
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
        city: prof.city ?? '',
        nss_status: prof.nss_status ?? '',
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [reset])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError('')
    setSuccess(false)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('You must be signed in.')
      setIsSubmitting(false)
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
      city: values.city.trim() || null,
      preferred_regions: preferredRegions.length ? preferredRegions : null,
      nss_status: values.nss_status.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: uErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', uid)
    if (uErr) {
      setError(uErr.message)
      setIsSubmitting(false)
      return
    }
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (refreshed) setProfile(refreshed as Profile)
    setSuccess(true)
    setShowSavedIndicator(true)
    setTimeout(() => setSuccess(false), 2000)
    setTimeout(() => setShowSavedIndicator(false), 3000)
    void fetch('/api/applications/recalculate-scores', { method: 'POST' })
      .catch(console.error)
    setIsSubmitting(false)
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
      subtitle="Keep your student details up to date for internships and NSS opportunities."
      verified={verified}
      profile={profile}
      hasCvDocument={hasCvDocument}
      hasCertificateDocument={hasCertificateDocument}
      hasSupportingDocuments={hasSupportingDocuments}
      documentsHref="/dashboard/student/documents"
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
              <h2 className="text-sm font-semibold text-gray-900">Education</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Institution name"
                    {...register('institution_name')}
                  />
                </div>
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
                <Input label="Qualification" {...register('qualification')} />
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
                  {...register('preferred_region', {
                    onChange: () => setValue('city', ''),
                  })}
                  options={[
                    { value: '', label: 'Select region' },
                    ...regionOptions,
                  ]}
                />
                {selectedRegion ? (
                  <Select
                    label="Your City / Town"
                    {...register('city')}
                    options={[
                      { value: '', label: 'Select city' },
                      ...(GHANA_CITIES[selectedRegion] ?? []).map((c) => ({
                        value: c,
                        label: c,
                      })),
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                ) : null}
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Preferred Work Regions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {GHANA_REGIONS.map((r) => (
                      <label
                        key={r}
                        className={[
                          'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all',
                          preferredRegions.includes(r)
                            ? 'border-brand bg-brand/10 font-medium text-brand'
                            : 'border-gray-200 text-gray-600 hover:border-brand/50',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={preferredRegions.includes(r)}
                          onChange={(e) => {
                            setPreferredRegions((prev) =>
                              e.target.checked
                                ? [...prev, r]
                                : prev.filter((x) => x !== r)
                            )
                          }}
                        />
                        <div
                          className={[
                            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2',
                            preferredRegions.includes(r)
                              ? 'border-brand bg-brand'
                              : 'border-gray-300',
                          ].join(' ')}
                        >
                          {preferredRegions.includes(r) ? (
                            <svg
                              className="h-2.5 w-2.5 text-white"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M8.5 2L4 7.5 1.5 5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : null}
                        </div>
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
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
              </div>
            </Card>
          </div>

          <div className='fixed bottom-6 right-6 z-40 flex flex-col items-end'>
            <button
              type='submit'
              disabled={isSubmitting || success}
              className={[
                'inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-colors',
                success
                  ? 'bg-green-600'
                  : isSubmitting
                    ? 'cursor-not-allowed bg-brand/70'
                    : 'bg-brand hover:bg-forest',
              ].join(' ')}
            >
              {isSubmitting ? (
                <>
                  <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='white' strokeWidth='4' />
                    <path className='opacity-75' fill='white' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                  </svg>
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className='h-4 w-4' />
                  Saved!
                </>
              ) : (
                <>
                  <CheckCircle className='h-4 w-4' />
                  Save changes
                </>
              )}
            </button>
            {showSavedIndicator ? (
              <p className='mt-2 flex items-center gap-1 text-xs font-semibold text-green-600'>
                <CheckCircle className='h-3 w-3' />
                Changes saved
              </p>
            ) : null}
          </div>
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
