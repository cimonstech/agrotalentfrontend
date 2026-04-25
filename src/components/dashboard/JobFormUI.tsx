'use client'

import { useRef, useState } from 'react'
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
import { cn, GHANA_REGIONS, JOB_TYPES } from '@/lib/utils'
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
    formState: { errors },
  } = form

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
    const payload: Record<string, unknown> = {
      ...values,
      description: descriptionHtml || null,
      responsibilities: responsibilitiesHtml || null,
      requirements: requirementsHtml || null,
      salary_currency: values.salary_currency || 'GHS',
    }
    if (profile?.role === 'admin') {
      payload.is_platform_job = !assignToFarm
      payload.farm_id = assignToFarm ? selectedFarmId || null : null
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
              className='w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none'
            />
          </FieldWrapper>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FieldWrapper label='Job Type' required confidence={confidence.job_type ?? null}>
              <Select
                label=''
                options={JOB_TYPES.map((j) => ({ value: j.value, label: j.label }))}
                {...register('job_type')}
              />
            </FieldWrapper>
            <FieldWrapper label='Location' required confidence={confidence.location ?? null}>
              <Select
                label=''
                options={GHANA_REGIONS.map((region) => ({ value: region, label: region }))}
                {...register('location')}
              />
            </FieldWrapper>
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
          <Input label='Salary min' type='number' min={0} {...register('salary_min')} />
          <Input label='Salary max' type='number' min={0} {...register('salary_max')} />
          <Input label='Currency' {...register('salary_currency')} />
          <Input label='Expires at' type='date' {...register('expires_at')} />
        </div>
      </Card>

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
