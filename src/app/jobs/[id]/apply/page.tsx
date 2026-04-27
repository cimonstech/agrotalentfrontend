'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matchScore'
import { GHANA_REGIONS, GHANA_CITIES } from '@/lib/locations'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Scan,
} from 'lucide-react'
import type { Job, Profile } from '@/types'

const supabase = createSupabaseClient()

type Step = 1 | 2 | 3

interface EligibilityData {
  qualification: string
  experience_years: number
  specialization: string
  region: string
  city: string
  skills: string
}

type JobRow = Job & {
  profiles: Pick<Profile, 'farm_name' | 'role'> | null
}

function getPosterName(
  farm: Pick<Profile, 'farm_name' | 'role'> | null | undefined
) {
  const farmName = farm?.farm_name?.trim() ?? ''
  if (!farmName) return ''
  const normalized = farmName.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (farm?.role === 'admin' || normalized.includes('agrotalent')) {
    return 'AgroTalent Hub'
  }
  return farmName
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobRow | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [existingApp, setExistingApp] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [eligibility, setEligibility] = useState<EligibilityData>({
    qualification: '',
    experience_years: 0,
    specialization: '',
    region: '',
    city: '',
    skills: '',
  })
  const [matchScore, setMatchScore] = useState<number>(0)
  const [scanning, setScanning] = useState(false)

  const [cvChoice, setCvChoice] = useState<'profile' | 'upload'>('profile')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [uploadedCvUrl, setUploadedCvUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coverLetter, setCoverLetter] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin?redirect=/jobs/' + jobId + '/apply')
        return
      }

      setUserId(user.id)

      const [jobRes, profileRes, appRes] = await Promise.all([
        supabase
          .from('jobs')
          .select(
            `
          *,
          profiles!jobs_farm_id_fkey ( farm_name, role )
        `
          )
          .eq('id', jobId)
          .maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('applicant_id', user.id)
          .maybeSingle(),
      ])

      if (jobRes.data && jobRes.data.status === 'active') {
        setJob(jobRes.data as JobRow)
      }
      if (profileRes.data) {
        const p = profileRes.data as Profile
        setProfile(p)
        setCvChoice(p.cv_url ? 'profile' : 'upload')
        setEligibility({
          qualification: p.qualification ?? '',
          experience_years: p.years_of_experience ?? 0,
          specialization: p.specialization ?? '',
          region: p.preferred_region ?? '',
          city: p.city ?? '',
          skills: p.skills ?? '',
        })
      }
      if (appRes.data) setExistingApp(true)
      setLoading(false)
    }
    void load()
  }, [jobId, router])

  useEffect(() => {
    if (!job) return
    const fakeProfile = {
      qualification: eligibility.qualification || null,
      years_of_experience: eligibility.experience_years,
      specialization: eligibility.specialization || null,
      preferred_region: eligibility.region || null,
      city: eligibility.city || null,
      preferred_regions: profile?.preferred_regions ?? null,
      preferred_cities: profile?.preferred_cities ?? null,
      institution_type: profile?.institution_type ?? null,
    } as unknown as Profile
    const score = calculateMatchScore(fakeProfile, job)
    setMatchScore(score)
  }, [eligibility, job, profile])

  const handleScanCV = async () => {
    const cvUrl =
      cvChoice === 'upload' && uploadedCvUrl
        ? uploadedCvUrl
        : profile?.cv_url ?? null

    if (!cvUrl) {
      alert('No CV available to scan. Please upload a CV first.')
      return
    }

    setScanning(true)

    try {
      const res = await fetch('/api/jobs/scan-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cv_url: cvUrl }),
      })

      const data = await res.json()

      console.log('[Scan] Response:', data)
      console.log('[Scan] Extracted:', (data as { data?: unknown }).data)

      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Scan failed')
      }

      if ((data as { success?: boolean }).success && (data as { data?: unknown }).data) {
        const extracted = (data as { data: {
          qualification?: string | null
          experience_years?: number | null
          specialization?: string | null
          location?: string | null
          city?: string | null
        } }).data

        console.log('[Scan] Updating eligibility with:', extracted)

        setEligibility((prev) => ({
          ...prev,
          qualification: extracted.qualification ?? prev.qualification,
          experience_years:
            extracted.experience_years ?? prev.experience_years,
          specialization: extracted.specialization ?? prev.specialization,
          region: extracted.location ?? prev.region,
          city: extracted.city ?? prev.city,
        }))

        setStep(1)
      } else {
        console.log('[Scan] No data in response:', data)
        alert(
          'CV scan completed but could not extract details. Please fill in the fields manually.'
        )
      }
    } catch (err) {
      console.error('CV scan error:', err)
      alert('Failed to scan CV. Please fill in the fields manually.')
    }

    setScanning(false)
  }

  const handleCVUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, PNG or WEBP.')
      return
    }

    setUploading(true)
    setUploadSuccess(false)

    try {
      if (!userId) {
        alert('Please sign in to upload a CV.')
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'cv')
      formData.append('file_name', file.name)

      const res = await fetch('/api/profile/upload-document', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          (data as Record<string, string>).error ?? 'Upload failed'
        )
      }

      const fileUrl = (data as Record<string, string>).url ?? null

      if (!fileUrl) {
        throw new Error('No URL returned from upload')
      }

      setUploadedCvUrl(fileUrl)
      setCvFile(file)
      setUploadSuccess(true)

      void Promise.resolve(
        supabase.from('documents').delete().eq('file_url', fileUrl)
      )
        .then(() =>
          console.log('[CV Upload] Removed document record for application CV')
        )
        .catch(console.error)
    } catch (err) {
      console.error('[CV Upload] Error:', err)
      alert(
        'Upload failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }

    setUploading(false)
  }

  const handleSubmit = async () => {
    console.log('[Submit] Starting submission...')
    console.log('[Submit] submitting state:', submitting)
    console.log('[Submit] job:', job?.id)
    console.log('[Submit] profile:', profile?.id, profile?.role)

    if (!job || !profile) return
    if (submitting) return

    setSubmitting(true)
    setSubmitError('')

    try {
      console.log('[Submit] Using cached userId:', userId)
      if (!userId) {
        throw new Error('Not signed in - please refresh and try again')
      }
      const user = { id: userId }

      console.log('[Submit] Checking for existing application...')
      let existing: { id: string } | null = null
      try {
        const result = await Promise.race([
          supabase
            .from('applications')
            .select('id')
            .eq('job_id', job.id)
            .eq('applicant_id', user.id)
            .maybeSingle(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          ),
        ])
        existing = (result as { data: typeof existing }).data
      } catch (timeoutErr) {
        console.warn('[Submit] Duplicate check timed out, proceeding...')
        existing = null
      }
      console.log('[Submit] Existing app:', existing)

      if (existing) {
        setSubmitError('You have already applied for this job')
        setSubmitting(false)
        return
      }

      const applicationCvUrl =
        cvChoice === 'upload' && uploadedCvUrl
          ? uploadedCvUrl
          : cvChoice === 'profile' && profile.cv_url
            ? profile.cv_url
            : null

      const insertResult = await Promise.race([
        supabase.from('applications').insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: coverLetter.trim() || null,
          status: 'pending',
          match_score: matchScore,
          application_cv_url: applicationCvUrl,
          extracted_qualification: eligibility.qualification || null,
          extracted_experience_years: eligibility.experience_years || null,
          extracted_specialization: eligibility.specialization || null,
          eligibility_data: {
            qualification: eligibility.qualification,
            experience_years: eligibility.experience_years,
            specialization: eligibility.specialization,
            region: eligibility.region,
            city: eligibility.city,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Insert timed out - please try again')),
            10000
          )
        ),
      ])
      const { error: insertError } = insertResult as {
        error: { message: string } | null
      }

      console.log('[Submit] Insert error:', insertError)

      if (insertError) throw new Error(insertError.message)

      void fetch('/api/applications/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, applicant_id: user.id }),
      }).catch(console.error)

      setSubmitSuccess(true)

      if (cvChoice === 'upload' && uploadedCvUrl) {
        void Promise.resolve(
          supabase.from('documents').delete().eq('file_url', uploadedCvUrl)
        )
          .then(() =>
            console.log('[Submit] Cleaned up application CV document record')
          )
          .catch(console.error)
      }

      setTimeout(() => {
        const roleRoutes: Record<string, string> = {
          graduate: '/dashboard/graduate/applications',
          student: '/dashboard/student/applications',
          skilled: '/dashboard/skilled/applications',
        }
        router.push(roleRoutes[profile.role] ?? '/dashboard')
      }, 2000)
    } catch (err) {
      console.error('[Submit] Caught error:', err)
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit application'
      )
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent' />
      </div>
    )
  }

  if (!job) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='text-center'>
          <p className='text-gray-500'>Job not found</p>
          <Link
            href='/jobs'
            className='mt-2 inline-block font-semibold text-brand'
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  if (existingApp) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
          <CheckCircle className='mx-auto mb-4 h-12 w-12 text-brand' />
          <h2 className='text-xl font-bold text-gray-900'>Already Applied</h2>
          <p className='mt-2 text-sm text-gray-500'>
            You have already applied for this position.
          </p>
          <Link
            href={
              '/dashboard/' + (profile?.role ?? 'graduate') + '/applications'
            }
            className='mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white transition-colors hover:bg-forest'
          >
            View My Applications
          </Link>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
          <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
          <h2 className='text-xl font-bold text-gray-900'>
            Application Submitted!
          </h2>
          <p className='mt-2 text-sm text-gray-500'>
            Your application has been submitted successfully. Redirecting...
          </p>
          <div className='mt-4 h-1 overflow-hidden rounded-full bg-gray-100'>
            <div className='h-full w-3/4 animate-pulse rounded-full bg-brand' />
          </div>
        </div>
      </div>
    )
  }

  const posterName = getPosterName(job.profiles)
  const scoreColor =
    matchScore >= 70
      ? 'text-green-600'
      : matchScore >= 50
        ? 'text-amber-600'
        : 'text-red-500'
  const scoreBarColor =
    matchScore >= 70
      ? 'bg-green-500'
      : matchScore >= 50
        ? 'bg-amber-400'
        : 'bg-red-400'

  return (
    <div className='min-h-screen bg-[#F5F5F0]'>
      <div className='sticky top-0 z-10 border-b border-gray-100 bg-white'>
        <div className='mx-auto flex max-w-2xl items-center gap-4 px-6 py-4'>
          <Link
            href={'/jobs/' + jobId}
            className='text-gray-400 transition-colors hover:text-gray-700'
          >
            <ArrowLeft className='h-5 w-5' />
          </Link>
          <div className='min-w-0 flex-1'>
            <h1 className='truncate text-sm font-bold text-gray-900'>
              {job.title}
            </h1>
            <p className='text-xs text-gray-400'>
              {posterName || (job.is_platform_job ? 'AgroTalent Hub' : 'Farm')}
              {' · '}
              {job.city ? job.city + ', ' + job.location : job.location}
            </p>
          </div>
          <div className='flex items-center gap-1.5'>
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={[
                  'h-2 rounded-full transition-all',
                  step === s
                    ? 'w-6 bg-brand'
                    : step > s
                      ? 'w-2 bg-brand'
                      : 'w-2 bg-gray-200',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-2xl px-6 py-8'>
        {step === 1 ? (
          <div>
            <div className='mb-6'>
              <h2 className='text-xl font-bold text-gray-900'>
                Check Your Eligibility
              </h2>
              <p className='mt-1 text-sm text-gray-500'>
                We pre-filled this from your profile. Update any details to see
                your match score.
              </p>
            </div>

            <div className='mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
              <div className='mb-3 flex items-center justify-between'>
                <span className='text-sm font-semibold text-gray-700'>
                  Your Match Score
                </span>
                <span className={['text-2xl font-bold', scoreColor].join(' ')}>
                  {matchScore}%
                </span>
              </div>
              <div className='h-2.5 w-full rounded-full bg-gray-100'>
                <div
                  className={['h-2.5 rounded-full transition-all duration-500', scoreBarColor].join(
                    ' '
                  )}
                  style={{ width: matchScore + '%' }}
                />
              </div>
              {matchScore < 20 ? (
                <div className='mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500' />
                  <p className='text-xs text-amber-700'>
                    This job may not be a strong match for your profile. You can
                    still apply.
                  </p>
                </div>
              ) : null}
            </div>

            <div className='space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
              <div>
                <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Qualification
                </label>
                <input
                  type='text'
                  value={eligibility.qualification}
                  onChange={(e) =>
                    setEligibility((prev) => ({
                      ...prev,
                      qualification: e.target.value,
                    }))
                  }
                  placeholder='e.g. BSc Agriculture, HND, Diploma'
                  className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none'
                />
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Specialization
                </label>
                <select
                  value={eligibility.specialization}
                  onChange={(e) =>
                    setEligibility((prev) => ({
                      ...prev,
                      specialization: e.target.value,
                    }))
                  }
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none'
                >
                  <option value=''>Select specialization</option>
                  <option value='crop'>Crop Science</option>
                  <option value='livestock'>Livestock</option>
                  <option value='agribusiness'>Agribusiness</option>
                  <option value='fisheries'>Fisheries</option>
                  <option value='forestry'>Forestry</option>
                  <option value='soil_science'>Soil Science</option>
                  <option value='agricultural_engineering'>
                    Agricultural Engineering
                  </option>
                  <option value='food_science'>Food Science</option>
                  <option value='other'>Other</option>
                </select>
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Years of Experience
                </label>
                <input
                  type='number'
                  min={0}
                  max={50}
                  value={eligibility.experience_years}
                  onChange={(e) =>
                    setEligibility((prev) => ({
                      ...prev,
                      experience_years: Number(e.target.value),
                    }))
                  }
                  className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none'
                />
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Your Region
                </label>
                <select
                  value={eligibility.region}
                  onChange={(e) =>
                    setEligibility((prev) => ({
                      ...prev,
                      region: e.target.value,
                      city: '',
                    }))
                  }
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none'
                >
                  <option value=''>Select region</option>
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {eligibility.region ? (
                <div>
                  <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                    Your City / Town
                  </label>
                  <select
                    value={eligibility.city}
                    onChange={(e) =>
                      setEligibility((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-brand focus:outline-none'
                  >
                    <option value=''>Select city</option>
                    {(GHANA_CITIES[eligibility.region] ?? []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value='other'>Other</option>
                  </select>
                </div>
              ) : null}
            </div>

            <button
              type='button'
              onClick={() => setStep(2)}
              className='mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white transition-colors hover:bg-forest'
            >
              Continue
              <ArrowRight className='h-4 w-4' />
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <div className='mb-6'>
              <h2 className='text-xl font-bold text-gray-900'>Your CV</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Choose which CV to submit with this application.
              </p>
            </div>

            <div className='space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
              <div className='space-y-3'>
                {profile?.cv_url ? (
                  <label
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all',
                      cvChoice === 'profile'
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:border-brand/30',
                    ].join(' ')}
                  >
                    <input
                      type='radio'
                      className='hidden'
                      checked={cvChoice === 'profile'}
                      onChange={() => {
                        setCvChoice('profile')
                        setUploadSuccess(false)
                      }}
                    />
                    <div
                      className={[
                        'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                        cvChoice === 'profile' ? 'border-brand' : 'border-gray-300',
                      ].join(' ')}
                    >
                      {cvChoice === 'profile' ? (
                        <div className='h-2.5 w-2.5 rounded-full bg-brand' />
                      ) : null}
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>
                        Use my profile CV
                      </p>
                      <p className='mt-0.5 text-xs text-gray-400'>
                        The CV already uploaded to your profile
                      </p>
                      <a
                        href={profile.cv_url}
                        target='_blank'
                        rel='noreferrer'
                        className='mt-1 inline-block text-xs font-semibold text-brand underline'
                        onClick={(e) => e.stopPropagation()}
                      >
                        Preview CV
                      </a>
                    </div>
                  </label>
                ) : null}

                <label
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all',
                    cvChoice === 'upload'
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-200 hover:border-brand/30',
                  ].join(' ')}
                >
                  <input
                    type='radio'
                    className='hidden'
                    checked={cvChoice === 'upload'}
                    onChange={() => {
                      setCvChoice('upload')
                      setUploadSuccess(false)
                    }}
                  />
                  <div
                    className={[
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                      cvChoice === 'upload' ? 'border-brand' : 'border-gray-300',
                    ].join(' ')}
                  >
                    {cvChoice === 'upload' ? (
                      <div className='h-2.5 w-2.5 rounded-full bg-brand' />
                    ) : null}
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-gray-900'>
                      Upload a CV for this application
                    </p>
                    <p className='mt-0.5 text-xs text-gray-400'>
                      Upload a CV tailored specifically for this role
                    </p>

                    {cvChoice === 'upload' ? (
                      <div className='mt-3'>
                        {cvFile ? (
                          <div className='flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3'>
                            <FileCheck className='h-4 w-4 text-green-600' />
                            <span className='truncate text-sm font-medium text-green-700'>
                              {cvFile.name}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(true)
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(true)
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(false)
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(false)
                                const file = e.dataTransfer.files?.[0]
                                if (file) void handleCVUpload(file)
                              }}
                              onClick={() => fileInputRef.current?.click()}
                              className={[
                                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
                                isDragging
                                  ? 'border-brand bg-brand/5'
                                  : 'border-gray-200 hover:border-brand/50',
                              ].join(' ')}
                            >
                              <Upload className='mb-2 h-8 w-8 text-gray-300' />
                              <span className='text-sm text-gray-500'>
                                Drop PDF or image here
                              </span>
                              <span className='mt-1 text-xs text-gray-300'>
                                or click to browse
                              </span>
                              <span className='mt-1 text-xs text-gray-300'>
                                PDF, JPG, PNG - max 5MB
                              </span>
                            </div>
                            <input
                              ref={fileInputRef}
                              type='file'
                              className='hidden'
                              accept='.pdf,.jpg,.jpeg,.png,.webp'
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) void handleCVUpload(f)
                              }}
                            />
                            <p className='mt-3 text-center text-xs text-gray-400'>
                              You can continue without uploading a CV.
                            </p>
                          </>
                        )}
                        {uploading ? (
                          <p className='mt-2 flex items-center gap-1 text-xs text-brand'>
                            <span className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent' />
                            Uploading...
                          </p>
                        ) : null}
                        {uploadSuccess ? (
                          <div className='mt-3 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3'>
                            <CheckCircle className='h-4 w-4 flex-shrink-0 text-green-600' />
                            <div>
                              <p className='text-sm font-semibold text-green-700'>
                                CV uploaded successfully
                              </p>
                              <p className='mt-0.5 text-xs text-green-600'>
                                {cvFile?.name}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </label>
              </div>

              {profile?.cv_url || uploadedCvUrl ? (
                <button
                  type='button'
                  onClick={() => void handleScanCV()}
                  disabled={scanning}
                  className='flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/5 disabled:opacity-50'
                >
                  <Scan className='h-4 w-4' />
                  {scanning ? 'Scanning...' : 'Scan CV'}
                </button>
              ) : null}
              {scanning ? (
                <p className='text-center text-xs text-gray-400'>
                  Reading your CV and updating eligibility details...
                </p>
              ) : null}
            </div>

            <div className='mt-6 flex gap-3'>
              <button
                type='button'
                onClick={() => setStep(1)}
                className='flex-1 rounded-2xl border border-gray-200 py-3.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50'
              >
                Back
              </button>
              <button
                type='button'
                onClick={() => setStep(3)}
                className='flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white transition-colors hover:bg-forest'
              >
                Continue
                <ArrowRight className='h-4 w-4' />
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <div className='mb-6'>
              <h2 className='text-xl font-bold text-gray-900'>Cover Letter</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Introduce yourself and explain why you are a good fit for this
                role. Optional but recommended.
              </p>
            </div>

            <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder='Dear Hiring Manager, I am writing to express my interest in the position...'
                rows={10}
                className='w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none'
              />
              <div className='mt-2 flex items-center justify-between'>
                <p className='text-xs text-gray-400'>
                  {coverLetter.length} / 2000 characters
                </p>
                {coverLetter.length > 2000 ? (
                  <p className='text-xs text-red-500'>Too long. Max 2000 characters</p>
                ) : null}
              </div>
            </div>

            <div className='mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
              <h3 className='mb-3 text-sm font-semibold text-gray-900'>
                Application Summary
              </h3>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Match Score</span>
                  <span className={['font-bold', scoreColor].join(' ')}>
                    {matchScore}%
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>CV</span>
                  <span className='font-medium text-gray-700'>
                    {cvChoice === 'upload' && uploadedCvUrl
                      ? cvFile?.name ?? 'Uploaded CV'
                      : cvChoice === 'profile' && profile?.cv_url
                        ? 'Profile CV'
                        : 'None'}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Cover Letter</span>
                  <span className='font-medium text-gray-700'>
                    {coverLetter.trim() ? 'Included' : 'Not included'}
                  </span>
                </div>
              </div>
            </div>

            {submitError ? (
              <div className='mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600'>
                {submitError}
              </div>
            ) : null}

            <div className='mt-6 flex gap-3'>
              <button
                type='button'
                onClick={() => setStep(2)}
                className='flex-1 rounded-2xl border border-gray-200 py-3.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50'
              >
                Back
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={submitting}
                className='flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white transition-colors hover:bg-forest disabled:opacity-50'
              >
                {submitting ? (
                  <>
                    <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
