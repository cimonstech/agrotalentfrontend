'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { CheckCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { GHANA_REGIONS, GHANA_CITIES } from '@/lib/locations'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'

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

type DocStatusMap = Partial<Record<'cv' | 'certificate' | 'transcript' | 'nss_letter', { file_name: string; status: string }>>

export default function GraduateProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hasCvDocument, setHasCvDocument] = useState(false)
  const [hasCertificateDocument, setHasCertificateDocument] = useState(false)
  const [docStatus, setDocStatus] = useState<DocStatusMap>({})
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
        supabase
          .from('documents')
          .select('document_type, file_name, status, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled || !p) {
        setLoading(false)
        return
      }
      const prof = p as Profile
      setProfile(prof)
      setEmail(prof.email ?? '')
      const rows =
        (docsRes.data as { document_type: string; file_name: string; status: string }[] | null) ?? []
      const types = new Set(rows.map((d) => d.document_type))
      setHasCvDocument(types.has('cv'))
      setHasCertificateDocument(types.has('certificate'))
      const nextStatus: DocStatusMap = {}
      for (const t of ['cv', 'certificate', 'transcript', 'nss_letter'] as const) {
        const row = rows.find((d) => d.document_type === t)
        if (row) nextStatus[t] = { file_name: row.file_name, status: row.status }
      }
      setDocStatus(nextStatus)
      setPreferredRegions(prof.preferred_regions ?? [])

      reset({
        full_name: prof.full_name ?? '',
        phone: prof.phone ?? '',
        institution_name: prof.institution_name ?? '',
        institution_type: prof.institution_type ?? '',
        qualification: prof.qualification ?? '',
        specialization: prof.specialization ?? '',
        graduation_year: prof.graduation_year != null ? String(prof.graduation_year) : '',
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
    const { error: uErr } = await supabase.from('profiles').update(payload).eq('id', uid)
    if (uErr) {
      setError(uErr.message)
      setIsSubmitting(false)
      return
    }
    const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (refreshed) setProfile(refreshed as Profile)
    setSuccess(true)
    setShowSavedIndicator(true)
    setTimeout(() => setSuccess(false), 2000)
    setTimeout(() => setShowSavedIndicator(false), 3000)
    void fetch('/api/applications/recalculate-scores', { method: 'POST' })
      .catch(console.error)
    setIsSubmitting(false)
  }

  const docRows = useMemo(
    () => [
      { key: 'cv', label: 'CV' },
      { key: 'certificate', label: 'Certificate' },
      { key: 'transcript', label: 'Transcript' },
      { key: 'nss_letter', label: 'NSS Letter' },
    ] as const,
    []
  )

  if (loading) {
    return <div className='p-6 text-sm text-gray-600'>Loading...</div>
  }

  return (
    <div className='p-6'>
      <div className='mx-auto max-w-3xl pb-28'>
        <DashboardPageHeader greeting='My Profile' subtitle='Manage your information and preferences' />

        {profile ? (
          <Card className='mb-4' padding='none'>
            <ProfileStrength profile={profile} hasCvDocument={hasCvDocument} hasCertificateDocument={hasCertificateDocument} />
          </Card>
        ) : null}

        {error ? <p className='mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p> : null}
        {success ? <p className='mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800'>Profile saved.</p> : null}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <Card>
            <h2 className='text-sm font-semibold text-gray-900'>Personal Information</h2>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Full Name</p>
                <Input {...register('full_name')} />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Phone</p>
                <Input type='tel' {...register('phone')} />
              </div>
              <div className='md:col-span-2'>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Email</p>
                <Input value={email} disabled readOnly />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className='text-sm font-semibold text-gray-900'>Academic Details</h2>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Institution Name</p>
                <Input {...register('institution_name')} />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Institution Type</p>
                <Select
                  {...register('institution_type')}
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'university', label: 'University' },
                    { value: 'training_college', label: 'Training college' },
                  ]}
                />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Qualification</p>
                <Input {...register('qualification')} />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Specialization</p>
                <Select
                  {...register('specialization')}
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'crop', label: 'Crop' },
                    { value: 'livestock', label: 'Livestock' },
                    { value: 'agribusiness', label: 'Agribusiness' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Graduation Year</p>
                <Input type='number' {...register('graduation_year')} />
              </div>
              <div>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>Preferred Region</p>
                <Select
                  {...register('preferred_region', {
                    onChange: () => setValue('city', ''),
                  })}
                  options={[{ value: '', label: 'Select region' }, ...regionOptions]}
                />
              </div>
              {selectedRegion ? (
                <div>
                  <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Your City / Town
                  </p>
                  <Select
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
                </div>
              ) : null}
              <div className='md:col-span-2'>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Preferred Work Regions
                </p>
                <div className='grid grid-cols-2 gap-2'>
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
                        type='checkbox'
                        className='hidden'
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
                            className='h-2.5 w-2.5 text-white'
                            viewBox='0 0 10 10'
                            fill='none'
                          >
                            <path
                              d='M8.5 2L4 7.5 1.5 5'
                              stroke='currentColor'
                              strokeWidth='1.5'
                              strokeLinecap='round'
                            />
                          </svg>
                        ) : null}
                      </div>
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <div className='md:col-span-2'>
                <p className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500'>NSS Status</p>
                <Select
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

          <Card>
            <h2 className='text-sm font-semibold text-gray-900'>Documents</h2>
            <div className='mt-4 space-y-2'>
              {docRows.map((item) => {
                const row = docStatus[item.key]
                return (
                  <div key={item.key} className='flex items-center justify-between rounded-xl bg-gray-50 p-3'>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>{item.label}</p>
                      {row?.file_name ? <p className='text-xs text-gray-500'>{row.file_name}</p> : null}
                    </div>
                    <div className='flex items-center gap-2'>
                      <StatusBadge status={row?.status ?? 'pending'} />
                      {row?.file_name ? (
                        <Link href='/dashboard/graduate/documents' className='text-xs font-semibold text-brand'>
                          View
                        </Link>
                      ) : (
                        <Link href='/dashboard/graduate/documents' className='rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white'>
                          Upload
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <h2 className='text-sm font-semibold text-gray-900'>Notification Preferences</h2>
            <div className='mt-4'>{profile ? <NotificationPreferences profile={profile} /> : null}</div>
          </Card>

          <Card>
            <h2 className='text-sm font-semibold text-gray-900'>Account</h2>
            <div className='mt-4'>
              <AccountDeletion />
            </div>
          </Card>

          <button
            type='submit'
            disabled={isSubmitting || success}
            className={[
              'fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-colors',
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
                <CheckCircle className='h-4 w-4' aria-hidden />
                Saved!
              </>
            ) : (
              <>
                <CheckCircle className='h-4 w-4' aria-hidden />
                Save Changes
              </>
            )}
          </button>
          {showSavedIndicator ? (
            <p className='fixed bottom-2 right-8 mt-2 flex items-center gap-1 text-xs font-semibold text-green-600'>
              <CheckCircle className='h-3 w-3' />
              Changes saved
            </p>
          ) : null}
        </form>
      </div>
    </div>
  )
}
