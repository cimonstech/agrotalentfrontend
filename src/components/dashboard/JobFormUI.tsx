'use client'

import { useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ClipboardPaste,
  FileCheck,
  PenLine,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import type { Profile } from '@/types'
import { GHANA_CITIES, GHANA_REGIONS } from '@/lib/locations'
import { cn, JOB_TYPES } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { getBorderClass, getFieldBadge, type Confidence } from '@/lib/confidence'
import type { useJobForm } from '@/hooks/useJobForm'

type Mode = 'upload' | 'paste' | 'manual'

type AssignmentFarm = {
  id: string
  farm_name: string | null
  full_name: string | null
  farm_location: string | null
}

interface JobFormUIProps {
  mode: 'new' | 'edit'
  jobId?: string
  profile: Profile | null
  formHook: ReturnType<typeof useJobForm>
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  farms?: AssignmentFarm[]
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result ?? '')
      resolve(value.includes(',') ? value.split(',')[1] ?? '' : value)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function JobFormUI({
  mode,
  profile,
  formHook,
  onSubmit,
  farms = [],
}: JobFormUIProps) {
  const [inputMode, setInputMode] = useState<Mode>('manual')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [assignToFarm, setAssignToFarm] = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    form,
    descriptionHtml,
    setDescriptionHtml,
    responsibilitiesHtml,
    setResponsibilitiesHtml,
    requirementsHtml,
    setRequirementsHtml,
    benefits,
    setBenefits,
    acceptableRegions,
    setAcceptableRegions,
    acceptableCities,
    setAcceptableCities,
    confidence,
    setConfidence,
    aiGeneratedFields,
    setAiGeneratedFields,
    generatingField,
    isSubmitting,
    submitSuccess,
    submitError,
    setSubmitError,
    fillFormFromAI,
    handleGenerateContent,
  } = formHook

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const selectedRegion = watch('location')
  const isSourcedJob = watch('is_sourced_job')
  const applicationMethod = watch('application_method')
  const cityOptions = selectedRegion
    ? (GHANA_CITIES[selectedRegion] ?? []).map((c) => ({ value: c, label: c }))
    : []

  const acceptableCityOptions = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const reg of acceptableRegions) {
      for (const c of GHANA_CITIES[reg] ?? []) {
        if (!seen.has(c)) {
          seen.add(c)
          list.push(c)
        }
      }
    }
    return list.sort()
  }, [acceptableRegions])

  const toggleAcceptableRegion = (r: string) => {
    setAcceptableRegions((prev) => {
      if (prev.includes(r)) {
        const removed = new Set(GHANA_CITIES[r] ?? [])
        setAcceptableCities((cities) =>
          cities.filter((city) => !removed.has(city))
        )
        return prev.filter((x) => x !== r)
      }
      return [...prev, r]
    })
  }

  const toggleAcceptableCity = (city: string) => {
    setAcceptableCities((prev) =>
      prev.includes(city) ? prev.filter((x) => x !== city) : [...prev, city]
    )
  }

  const hasAiData = Object.values(confidence).some((v) => v != null)

  const runParseText = async () => {
    setParseError('')
    if (pasteText.trim().length < 20) {
      setParseError('Text too short to parse')
      return
    }
    setIsParsing(true)
    try {
      const res = await fetch('/api/jobs/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      })
      const data = await res.json()
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to parse text')
      }
      fillFormFromAI(data.data as Record<string, unknown>)
      setInputMode('manual')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse text')
    } finally {
      setIsParsing(false)
    }
  }

  const runExtractDocument = async () => {
    if (!uploadFile) return
    setUploadError('')
    setIsExtracting(true)
    try {
      const base64 = await toBase64(uploadFile)
      const res = await fetch('/api/jobs/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          mediaType: uploadFile.type,
          fileName: uploadFile.name,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to parse document')
      }
      fillFormFromAI(data.data as Record<string, unknown>)
      setInputMode('manual')
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to extract details'
      )
    } finally {
      setIsExtracting(false)
    }
  }

  const submitForm = handleSubmit(async (values) => {
    const {
      contract_type,
      is_sourced_job,
      source_platform,
      source_website,
      source_contact_name,
      source_platform_url,
      source_name,
      source_contact,
      source_phone,
      source_email,
      application_method,
      external_apply_url,
      accommodation_provided: _accommodationProvidedField,
      commission_included: _commissionIncludedField,
      commission_percentage: _jobCommissionPct,
      required_institution_type: institutionType,
      expires_at: expiresAtRaw,
      city: cityRaw,
      ...rest
    } = values

    const expiresAtNormalized =
      expiresAtRaw != null && String(expiresAtRaw).trim() !== ''
        ? String(expiresAtRaw).includes('T')
          ? String(expiresAtRaw)
          : String(expiresAtRaw) + 'T23:59:59.000Z'
        : null

    const institutionRaw = institutionType as string | undefined
    const institutionNormalized =
      institutionRaw && institutionRaw.trim() !== ''
        ? (institutionRaw as 'university' | 'training_college' | 'any')
        : null

    const benefitsPayload = {
      accommodation: benefits.accommodation,
      meals: benefits.meals,
      meal_amount: benefits.meals ? benefits.meal_amount : null,
      transport: benefits.transport,
      commission: benefits.commission,
      commission_percentage: benefits.commission
        ? benefits.commission_percentage
        : null,
      health_care: benefits.health_care,
      internet_data: benefits.internet_data,
      uniform: benefits.uniform,
      annual_leave_days: benefits.annual_leave_days,
      other: benefits.other.trim() ? benefits.other.trim() : null,
    }

    const payload: Record<string, unknown> = {
      ...rest,
      city: cityRaw != null && String(cityRaw).trim() !== '' ? cityRaw : null,
      description: descriptionHtml || null,
      responsibilities: responsibilitiesHtml || null,
      requirements: requirementsHtml || null,
      salary_currency: values.salary_currency || 'GHS',
      required_institution_type: institutionNormalized,
      expires_at: expiresAtNormalized,
      contract_type: contract_type ? contract_type : null,
      benefits: benefitsPayload,
      accommodation_provided: benefits.accommodation,
      commission_included: benefits.commission,
      commission_percentage: benefits.commission
        ? benefits.commission_percentage
        : null,
      is_sourced_job: is_sourced_job ?? false,
      source_platform: source_platform?.trim() || null,
      source_website: source_website?.trim() || null,
      source_contact_name: source_contact_name?.trim() || null,
      source_platform_url: source_platform_url?.trim() || null,
      source_name: source_name?.trim() || null,
      source_contact: source_contact?.trim() || null,
      source_phone: source_phone?.trim() || null,
      source_email: source_contact?.trim() || source_email?.trim() || null,
      application_method: application_method ?? 'platform',
      external_apply_url:
        application_method === 'external' && external_apply_url?.trim()
          ? external_apply_url.trim()
          : null,
      acceptable_regions:
        acceptableRegions.length > 0 ? acceptableRegions : null,
      acceptable_cities:
        acceptableCities.length > 0 ? acceptableCities : null,
    }
    if (profile?.role === 'admin') {
      payload.is_platform_job = !assignToFarm
      payload.farm_id = assignToFarm
        ? selectedFarmId || null
        : undefined
      payload.assigned_farm_id = assignToFarm ? selectedFarmId || null : null
    }
    await onSubmit(payload)
  })

  return (
    <form className='space-y-4' onSubmit={submitForm}>
      {submitSuccess ? (
        <div className='animate-in slide-in-from-top fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-green-600 px-6 py-4 text-white shadow-xl duration-300'>
          <CheckCircle className='h-5 w-5 flex-shrink-0' />
          <div>
            <p className='text-sm font-bold'>
              {mode === 'new' ? 'Job posted successfully!' : 'Job updated successfully!'}
            </p>
            <p className='mt-0.5 text-xs text-green-100'>
              Redirecting you to your jobs...
            </p>
          </div>
        </div>
      ) : null}

      <div className='mb-2 flex gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm'>
        <button
          type='button'
          onClick={() => setInputMode('upload')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            inputMode === 'upload'
              ? 'bg-brand text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
        >
          <UploadCloud className='h-4 w-4' />
          Upload Document
        </button>
        <button
          type='button'
          onClick={() => setInputMode('paste')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            inputMode === 'paste'
              ? 'bg-brand text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
        >
          <ClipboardPaste className='h-4 w-4' />
          Paste Text
        </button>
        <button
          type='button'
          onClick={() => setInputMode('manual')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
            inputMode === 'manual'
              ? 'bg-brand text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
        >
          <PenLine className='h-4 w-4' />
          Fill Manually
        </button>
      </div>

      {mode === 'edit' ? (
        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800'>
          This will replace existing job details
        </div>
      ) : null}

      {inputMode === 'upload' ? (
        <Card className='p-6'>
          <div
            role='button'
            tabIndex={0}
            className={cn(
              'cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all',
              dragging
                ? 'border-brand bg-brand/5'
                : uploadFile
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-gray-200'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0] ?? null
              setUploadFile(file)
            }}
          >
            {!uploadFile ? (
              <>
                <UploadCloud className='mx-auto mb-2 h-10 w-10 text-gray-300' />
                <p className='font-semibold text-gray-600'>
                  Drop your PDF or image here
                </p>
                <p className='text-sm text-gray-400'>or click to browse</p>
              </>
            ) : (
              <>
                <FileCheck className='mx-auto mb-2 h-10 w-10 text-green-500' />
                <p className='font-semibold text-gray-800'>{uploadFile.name}</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='.pdf,.jpg,.jpeg,.png,.webp'
            className='hidden'
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
          />
          <button
            type='button'
            onClick={() => void runExtractDocument()}
            disabled={!uploadFile || isExtracting}
            className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50'
          >
            <Sparkles className='h-4 w-4' />
            {isExtracting ? 'Reading document...' : 'Extract Job Details'}
          </button>
          {uploadError ? (
            <p className='mt-2 text-sm text-red-600'>{uploadError}</p>
          ) : null}
        </Card>
      ) : null}

      {inputMode === 'paste' ? (
        <Card className='p-6'>
          <p className='mb-3 font-semibold text-gray-800'>Paste job details below</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={10}
            className='w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20'
          />
          <button
            type='button'
            onClick={() => void runParseText()}
            disabled={isParsing || pasteText.trim().length < 20}
            className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50'
          >
            <ClipboardPaste className='h-4 w-4' />
            {isParsing ? 'Parsing text...' : 'Parse Job Details'}
          </button>
          {parseError ? <p className='mt-2 text-sm text-red-600'>{parseError}</p> : null}
        </Card>
      ) : null}

      {profile?.role === 'admin' ? (
        <Card className='mb-4 border border-brand/15 bg-brand/3 p-5'>
          <h3 className='mb-2 text-sm font-bold text-gray-900'>Job Assignment</h3>
          <label className='flex items-center gap-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={assignToFarm}
              onChange={(e) => setAssignToFarm(e.target.checked)}
            />
            Assign this job to a farm
          </label>
          {assignToFarm ? (
            <div className='mt-3'>
              <Select
                label='Select farm'
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                options={[
                  { value: '', label: 'Select farm' },
                  ...farms.map((farm) => ({
                    value: farm.id,
                    label:
                      farm.farm_name ??
                      farm.full_name ??
                      farm.farm_location ??
                      farm.id,
                  })),
                ]}
              />
            </div>
          ) : null}
          <p className='mt-2 text-xs text-gray-500'>
            If unassigned, job shows as posted by AgroTalent Hub
          </p>
        </Card>
      ) : null}

      {hasAiData ? (
        <div className='flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4'>
          <Sparkles className='mt-0.5 h-5 w-5 flex-shrink-0 text-brand' />
          <div>
            <p className='text-sm font-semibold text-brand'>
              Job details extracted from your document
            </p>
            <p className='mt-1 text-xs text-gray-500'>
              Review highlighted fields before posting.
            </p>
          </div>
          <button
            type='button'
            className='ml-auto text-xs text-gray-400 hover:text-gray-600'
            onClick={() => {
              setConfidence({})
              setDescriptionHtml('')
              setResponsibilitiesHtml('')
              setRequirementsHtml('')
              setAiGeneratedFields(new Set())
            }}
          >
            Clear AI data
          </button>
        </div>
      ) : null}

      <Card className='p-6'>
        <h2 className='mb-5 text-base font-bold text-gray-900'>Job Details</h2>
        <div className='space-y-4'>
          <FieldWrapper label='Job Title' required confidence={confidence.title ?? null}>
            <input
              {...register('title')}
              className={[
                'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none',
                errors.title
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-gray-200 focus:border-brand',
              ].join(' ')}
            />
          </FieldWrapper>
          {errors.title ? (
            <p className='mt-1 text-xs text-red-500'>{errors.title.message}</p>
          ) : null}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FieldWrapper label='Job Type' required confidence={confidence.job_type ?? null}>
              <Select
                label=''
                options={JOB_TYPES.map((j) => ({ value: j.value, label: j.label }))}
                {...register('job_type')}
              />
            </FieldWrapper>
            <div>
              <FieldWrapper label='Location' required confidence={confidence.location ?? null}>
                <Select
                  label=''
                  options={GHANA_REGIONS.map((region) => ({
                    value: region,
                    label: region,
                  }))}
                  className={
                    errors.location
                      ? 'border-red-300 focus:border-red-400'
                      : undefined
                  }
                  {...register('location', {
                    onChange: () => setValue('city', ''),
                  })}
                />
              </FieldWrapper>
              {errors.location ? (
                <p className='mt-1 text-xs text-red-500'>{errors.location.message}</p>
              ) : null}
            </div>
          </div>
          {selectedRegion ? (
            <Select
              label='Job City / Town (optional)'
              options={[{ value: '', label: 'Select city' }, ...cityOptions]}
              {...register('city')}
            />
          ) : null}

          <div>
            <p className='mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Acceptable Candidate Locations
            </p>
            <p className='mb-3 text-xs text-gray-400'>
              Regions and cities you are willing to accept candidates from. Leave
              empty to accept from anywhere.
            </p>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
              Acceptable Regions
            </p>
            <div className='grid grid-cols-2 gap-2'>
              {GHANA_REGIONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all',
                    acceptableRegions.includes(r)
                      ? 'border-brand bg-brand/10 font-medium text-brand'
                      : 'border-gray-200 text-gray-600 hover:border-brand/50'
                  )}
                >
                  <input
                    type='checkbox'
                    className='hidden'
                    checked={acceptableRegions.includes(r)}
                    onChange={() => toggleAcceptableRegion(r)}
                  />
                  <div
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2',
                      acceptableRegions.includes(r)
                        ? 'border-brand bg-brand'
                        : 'border-gray-300'
                    )}
                  >
                    {acceptableRegions.includes(r) ? (
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
            {acceptableRegions.length > 0 ? (
              <div className='mt-4'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Acceptable Cities / Towns (optional)
                </p>
                <p className='mb-2 text-xs text-gray-400'>
                  Select specific towns within your chosen regions
                </p>
                <div className='grid grid-cols-2 gap-2'>
                  {acceptableCityOptions.map((c) => (
                    <label
                      key={c}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all',
                        acceptableCities.includes(c)
                          ? 'border-brand bg-brand/10 font-medium text-brand'
                          : 'border-gray-200 text-gray-600 hover:border-brand/50'
                      )}
                    >
                      <input
                        type='checkbox'
                        className='hidden'
                        checked={acceptableCities.includes(c)}
                        onChange={() => toggleAcceptableCity(c)}
                      />
                      <div
                        className={cn(
                          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2',
                          acceptableCities.includes(c)
                            ? 'border-brand bg-brand'
                            : 'border-gray-300'
                        )}
                      >
                        {acceptableCities.includes(c) ? (
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
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Input label='Address' {...register('address')} />
          <RichTextEditor
            label='Job Description'
            required
            value={descriptionHtml}
            onChange={(html) => {
              setDescriptionHtml(html)
              setValue('description' as never, html as never)
            }}
            onGenerateAI={() => void handleGenerateContent('description')}
            isGenerating={generatingField === 'description'}
            aiGenerated={aiGeneratedFields.has('description')}
            confidenceBadge={confidence.description ?? null}
          />
          <RichTextEditor
            label='Responsibilities'
            value={responsibilitiesHtml}
            onChange={setResponsibilitiesHtml}
            onGenerateAI={() => void handleGenerateContent('responsibilities')}
            isGenerating={generatingField === 'responsibilities'}
            aiGenerated={aiGeneratedFields.has('responsibilities')}
          />
          <RichTextEditor
            label='Requirements'
            value={requirementsHtml}
            onChange={setRequirementsHtml}
            onGenerateAI={() => void handleGenerateContent('requirements')}
            isGenerating={generatingField === 'requirements'}
            aiGenerated={aiGeneratedFields.has('requirements')}
          />
        </div>
      </Card>

      <Card className='p-6'>
        <h2 className='mb-5 text-base font-bold text-gray-900'>Requirements</h2>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Input label='Qualification' {...register('required_qualification')} />
          <Select
            label='Institution type'
            options={[
              { value: '', label: 'Not specified' },
              { value: 'university', label: 'University' },
              { value: 'training_college', label: 'Training college' },
              { value: 'any', label: 'Any' },
            ]}
            {...register('required_institution_type')}
          />
          <Input label='Specialization' {...register('required_specialization')} />
          <Input
            label='Experience years'
            type='number'
            min={0}
            {...register('required_experience_years')}
          />
          <Input label='Max applications' type='number' min={1} {...register('max_applications')} />
        </div>
      </Card>

      <Card className='p-6'>
        <h2 className='mb-5 text-base font-bold text-gray-900'>Compensation</h2>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Select
            label='Contract type (optional)'
            options={[
              { value: '', label: 'Not specified' },
              { value: 'permanent', label: 'Permanent' },
              { value: 'contract', label: 'Contract' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'casual', label: 'Casual' },
            ]}
            {...register('contract_type')}
          />
          <Input label='Salary min' type='number' min={0} {...register('salary_min')} />
          <div>
            <Input
              label='Salary max'
              type='number'
              min={0}
              {...register('salary_max')}
              className={
                errors.salary_max
                  ? 'border-red-300 focus:border-red-400'
                  : undefined
              }
            />
            {errors.salary_max ? (
              <p className='mt-1 text-xs text-red-500'>{errors.salary_max.message}</p>
            ) : null}
          </div>
          <Input label='Currency' {...register('salary_currency')} />
          <div>
            <Input
              label='Expires at'
              type='date'
              {...register('expires_at')}
              className={
                errors.expires_at
                  ? 'border-red-300 focus:border-red-400'
                  : undefined
              }
            />
            {errors.expires_at ? (
              <p className='mt-1 text-xs text-red-500'>{errors.expires_at.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className='mb-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
        <h2 className='mb-5 text-base font-bold text-gray-900'>Benefits and Perks</h2>
        <div className='grid grid-cols-2 gap-3'>
          <BenefitToggleRow
            label='Accommodation provided'
            checked={benefits.accommodation}
            onChange={(v) =>
              setBenefits((prev) => ({ ...prev, accommodation: v }))
            }
          />
          <BenefitToggleRow
            label='Meals / food support'
            checked={benefits.meals}
            onChange={(v) =>
              setBenefits((prev) => ({
                ...prev,
                meals: v,
                meal_amount: v ? prev.meal_amount : null,
              }))
            }
          />
          <BenefitToggleRow
            label='Transport allowance'
            checked={benefits.transport}
            onChange={(v) =>
              setBenefits((prev) => ({ ...prev, transport: v }))
            }
          />
          <BenefitToggleRow
            label='Health care support'
            checked={benefits.health_care}
            onChange={(v) =>
              setBenefits((prev) => ({ ...prev, health_care: v }))
            }
          />
          <BenefitToggleRow
            label='Internet / data'
            checked={benefits.internet_data}
            onChange={(v) =>
              setBenefits((prev) => ({ ...prev, internet_data: v }))
            }
          />
          <BenefitToggleRow
            label='Uniform provided'
            checked={benefits.uniform}
            onChange={(v) =>
              setBenefits((prev) => ({ ...prev, uniform: v }))
            }
          />
          <BenefitToggleRow
            label='Commission'
            checked={benefits.commission}
            onChange={(v) =>
              setBenefits((prev) => ({
                ...prev,
                commission: v,
                commission_percentage: v ? prev.commission_percentage : null,
              }))
            }
          />
        </div>
        {benefits.meals ? (
          <div className='mt-2'>
            <p className='mt-2 text-xs text-gray-400'>
              Monthly meal support amount (GHS)
            </p>
            <input
              type='number'
              min={0}
              className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
              value={benefits.meal_amount ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                setBenefits((prev) => ({
                  ...prev,
                  meal_amount:
                    raw === '' ? null : Math.max(0, Number(raw) || 0),
                }))
              }}
            />
          </div>
        ) : null}
        {benefits.commission ? (
          <div className='mt-2'>
            <p className='mt-2 text-xs text-gray-400'>Commission percentage (%)</p>
            <input
              type='number'
              min={0}
              max={100}
              step={0.5}
              className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
              value={benefits.commission_percentage ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                setBenefits((prev) => ({
                  ...prev,
                  commission_percentage:
                    raw === '' ? null : Math.min(100, Math.max(0, Number(raw) || 0)),
                }))
              }}
            />
          </div>
        ) : null}
        <div className='mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4'>
          <p className='text-sm font-semibold text-gray-900'>Annual leave days</p>
          <p className='mt-1 text-xs text-gray-500'>
            Paid leave days per year (0 to 365)
          </p>
          <input
            type='number'
            min={0}
            max={365}
            inputMode='numeric'
            aria-label='Annual leave days'
            className='mt-3 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center text-base font-semibold tabular-nums text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25'
            value={benefits.annual_leave_days ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              setBenefits((prev) => ({
                ...prev,
                annual_leave_days:
                  raw === '' ? null : Math.min(365, Math.max(0, Number(raw) || 0)),
              }))
            }}
          />
        </div>
        <p className='mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
          Other benefits
        </p>
        <input
          type='text'
          placeholder='e.g. Free electricity, housing allowance'
          className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
          value={benefits.other}
          onChange={(e) =>
            setBenefits((prev) => ({ ...prev, other: e.target.value }))
          }
        />
      </div>

      {profile?.role === 'admin' ? (
        <div className='mb-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-6'>
          <h2 className='mb-2 text-sm font-bold text-gray-900'>Source Information</h2>
          <p className='mb-4 text-xs text-amber-600'>
            Only visible to admins. Never shown publicly.
          </p>
          <label className='flex cursor-pointer items-center justify-between rounded-xl bg-white/60 p-3'>
            <span className='text-sm text-gray-800'>
              This is a sourced job (copied from another platform)
            </span>
            <span
              className={[
                'pointer-events-none relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
                isSourcedJob ? 'bg-brand' : 'bg-gray-200',
              ].join(' ')}
            >
              <input
                type='checkbox'
                className='peer sr-only'
                {...register('is_sourced_job')}
              />
              <span
                className={[
                  'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                  isSourcedJob ? 'translate-x-4' : 'translate-x-1',
                ].join(' ')}
              />
            </span>
          </label>
          {isSourcedJob ? (
            <div className='mt-4 space-y-4'>
              <Select
                label='Platform / Source'
                options={[
                  { value: '', label: 'Select platform' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'linkedin', label: 'LinkedIn' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'jobweb', label: 'Jobweb Ghana' },
                  { value: 'brighter_monday', label: 'Brighter Monday' },
                  { value: 'walk_in', label: 'Walk-in / Direct' },
                  { value: 'other', label: 'Other website' },
                ]}
                {...register('source_platform')}
              />
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Original post URL (optional)
                </label>
                <input
                  type='url'
                  placeholder='https://...'
                  className={[
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none',
                    errors.source_platform_url
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-brand',
                  ].join(' ')}
                  {...register('source_platform_url')}
                />
                {errors.source_platform_url ? (
                  <p className='mt-1 text-xs text-red-500'>
                    {errors.source_platform_url.message}
                  </p>
                ) : null}
                <p className='mt-1 text-xs text-gray-400'>
                  Link to the original job post for your reference
                </p>
              </div>
              <hr className='border-gray-200' />
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Company or Farm name (optional)
                </label>
                <input
                  type='text'
                  placeholder='e.g. Francis Farms, Premier Poultry'
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
                  {...register('source_name')}
                />
                <p className='mt-1 text-xs text-gray-400'>
                  {`If known. Shown as "In partnership with..." on the preview page.`}
                </p>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Company website (optional)
                </label>
                <input
                  type='url'
                  placeholder='https://...'
                  className={[
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none',
                    errors.source_website
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-brand',
                  ].join(' ')}
                  {...register('source_website')}
                />
                {errors.source_website ? (
                  <p className='mt-1 text-xs text-red-500'>{errors.source_website.message}</p>
                ) : null}
                <p className='mt-1 text-xs text-gray-400'>
                  The company name will link here on the preview page.
                </p>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Contact person name (optional)
                </label>
                <input
                  type='text'
                  placeholder='e.g. Mr Kofi Mensah'
                  className='w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
                  {...register('source_contact_name')}
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  WhatsApp / Phone number
                </label>
                <input
                  type='tel'
                  placeholder='+233 XX XXX XXXX'
                  className={[
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none',
                    errors.source_phone
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-brand',
                  ].join(' ')}
                  {...register('source_phone')}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[\s\-\+\(\)]/g, '')
                    if (val.startsWith('0')) val = '233' + val.slice(1)
                    if (!val.startsWith('233') && val.length > 0) val = '233' + val
                    setValue('source_phone', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }}
                />
                {errors.source_phone ? (
                  <p className='mt-1 text-xs text-red-500'>{errors.source_phone.message}</p>
                ) : null}
                <p className='mt-1 text-xs text-gray-400'>
                  Format: 233XXXXXXXXX (12 digits). Starts with 0 will be auto-converted.
                </p>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Contact email (optional)
                </label>
                <input
                  type='email'
                  placeholder='farm@email.com'
                  className={[
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none',
                    errors.source_contact
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-brand',
                  ].join(' ')}
                  {...register('source_contact')}
                />
                {errors.source_contact ? (
                  <p className='mt-1 text-xs text-red-500'>{errors.source_contact.message}</p>
                ) : null}
              </div>
              <p className='text-xs font-semibold text-gray-600'>
                Application method
              </p>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <label className='flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm'>
                  <input
                    type='radio'
                    value='platform'
                    className='text-brand'
                    {...register('application_method')}
                  />
                  Candidates apply on AgroTalent Hub
                </label>
                <label className='flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm'>
                  <input
                    type='radio'
                    value='external'
                    className='text-brand'
                    {...register('application_method')}
                  />
                  External application
                </label>
              </div>
              {applicationMethod === 'external' ? (
                <div>
                  <p className='mb-1 text-xs text-gray-500'>External apply URL</p>
                  <input
                    type='url'
                    placeholder='https://'
                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none'
                    {...register('external_apply_url')}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {submitError ? (
        <div className='mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4'>
          <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500' />
          <div>
            <p className='text-sm font-semibold text-red-700'>Failed to submit</p>
            <p className='mt-0.5 text-xs text-red-600'>{submitError}</p>
          </div>
        </div>
      ) : null}

      {(errors.title?.message ||
        errors.job_type?.message ||
        errors.location?.message) ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'>
          {errors.title?.message ||
            errors.job_type?.message ||
            errors.location?.message}
        </div>
      ) : null}

      <button
        type='submit'
        disabled={isSubmitting || submitSuccess}
        className={cn(
          'fixed bottom-6 right-6 z-40 rounded-2xl px-8 py-3 font-bold text-white shadow-lg transition-colors',
          submitSuccess
            ? 'bg-green-600'
            : isSubmitting
              ? 'cursor-not-allowed bg-brand/70'
              : 'bg-brand hover:bg-forest'
        )}
      >
        <span className='inline-flex items-center gap-2'>
          {submitSuccess ? (
            <CheckCircle className='h-4 w-4' />
          ) : isSubmitting ? (
            <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='white'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='white'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
              />
            </svg>
          ) : (
            <Briefcase className='h-4 w-4' />
          )}
          {submitSuccess
            ? mode === 'new'
              ? 'Job Posted!'
              : 'Saved!'
            : isSubmitting
              ? mode === 'new'
                ? 'Posting...'
                : 'Saving...'
              : mode === 'new'
                ? 'Post Job'
                : 'Save Changes'}
        </span>
      </button>
    </form>
  )
}

function BenefitToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between rounded-xl bg-gray-50 p-3'>
      <span className='text-sm text-gray-800'>{label}</span>
      <button
        type='button'
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

function FieldWrapper({
  label,
  required = false,
  confidence,
  children,
}: {
  label: string
  required?: boolean
  confidence: Confidence
  children: React.ReactNode
}) {
  const badge = getFieldBadge(confidence)
  return (
    <div className='w-full'>
      <div className='mb-1.5 flex items-center justify-between'>
        <label className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
          {label}
          {required ? <span className='ml-0.5 text-red-500'>*</span> : null}
        </label>
        {badge ? <span className={badge.className}>{badge.label}</span> : null}
      </div>
      <div
        className={cn(
          'overflow-hidden rounded-xl border p-0.5 transition-all',
          getBorderClass(confidence)
        )}
      >
        {children}
      </div>
    </div>
  )
}
