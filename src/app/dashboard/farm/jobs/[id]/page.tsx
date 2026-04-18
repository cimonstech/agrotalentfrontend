'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'
import { formatDate, GHANA_REGIONS, JOB_TYPES } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'

const supabase = createSupabaseClient()

const jobTypeValues = [
  'farm_hand',
  'farm_manager',
  'intern',
  'nss',
  'data_collector',
] as const satisfies readonly Job['job_type'][]

const institutionOptions = [
  { value: '', label: 'Not specified' },
  { value: 'university', label: 'University' },
  { value: 'training_college', label: 'Training college' },
  { value: 'any', label: 'Any' },
]

function parseOptionalNumber(s: string | undefined): number | undefined {
  if (s == null || s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const jobFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z
      .string()
      .min(50, 'Description must be at least 50 characters'),
    job_type: z.enum(jobTypeValues),
    location: z
      .string()
      .min(1, 'Location is required')
      .refine(
        (v) => (GHANA_REGIONS as readonly string[]).includes(v),
        'Select a valid region'
      ),
    address: z.string().optional(),
    salary_min: z.string().optional(),
    salary_max: z.string().optional(),
    required_qualification: z.string().optional(),
    required_institution_type: z.enum([
      '',
      'university',
      'training_college',
      'any',
    ]),
    required_experience_years: z
      .string()
      .min(1)
      .refine((s) => {
        const n = Number(s)
        return Number.isFinite(n) && n >= 0
      }, 'Enter a valid number of years'),
    required_specialization: z.string().optional(),
    expires_at: z.string().min(1, 'Closing date is required'),
    max_applications: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const min = parseOptionalNumber(data.salary_min)
    const max = parseOptionalNumber(data.salary_max)
    if (min != null && max != null && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Maximum salary must be greater than or equal to minimum salary',
        path: ['salary_max'],
      })
    }
    const end = new Date(`${data.expires_at}T23:59:59`)
    if (!(end.getTime() > Date.now())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Closing date must be in the future',
        path: ['expires_at'],
      })
    }
  })

type JobFormValues = z.infer<typeof jobFormSchema>

const REGION_OPTIONS = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

const JOB_TYPE_SELECT = JOB_TYPES.map((j) => ({
  value: j.value,
  label: j.label,
}))

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function jobToFormValues(job: Job): JobFormValues {
  const exp = job.expires_at
    ? job.expires_at.slice(0, 10)
    : ''
  return {
    title: job.title,
    description: job.description,
    job_type: job.job_type,
    location: job.location,
    address: job.address ?? '',
    salary_min:
      job.salary_min != null && Number.isFinite(job.salary_min)
        ? String(job.salary_min)
        : '',
    salary_max:
      job.salary_max != null && Number.isFinite(job.salary_max)
        ? String(job.salary_max)
        : '',
    required_qualification: job.required_qualification ?? '',
    required_institution_type: job.required_institution_type ?? '',
    required_experience_years: String(job.required_experience_years ?? 0),
    required_specialization: job.required_specialization ?? '',
    expires_at: exp,
    max_applications:
      job.max_applications != null && Number.isFinite(job.max_applications)
        ? String(job.max_applications)
        : '',
  }
}

export default function FarmJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null | undefined>(undefined)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toggling, setToggling] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      required_experience_years: '0',
      required_institution_type: '',
    },
  })

  async function loadJob() {
    setLoadError('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setJob(null)
      setLoadError('Not signed in')
      return
    }
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('farm_id', auth.user.id)
      .maybeSingle()
    if (error) {
      setLoadError(error.message)
      setJob(null)
      return
    }
    if (!data) {
      setJob(null)
      return
    }
    const row = data as Job
    setJob(row)
    reset(jobToFormValues(row))
  }

  useEffect(() => {
    loadJob()
  }, [jobId])

  async function onSave(values: JobFormValues) {
    if (!job) return
    setActionError('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setActionError('Not signed in')
      return
    }

    const inst = values.required_institution_type
    const institution: Job['required_institution_type'] | null =
      inst === '' ? null : inst

    const expiresIso = new Date(`${values.expires_at}T12:00:00`).toISOString()
    const salaryMin = parseOptionalNumber(values.salary_min)
    const salaryMax = parseOptionalNumber(values.salary_max)
    const maxApps = parseOptionalNumber(values.max_applications)
    const expYears = Number(values.required_experience_years)

    const { error } = await supabase
      .from('jobs')
      .update({
        title: values.title,
        description: values.description,
        job_type: values.job_type,
        location: values.location,
        address: values.address?.trim() || null,
        salary_min: salaryMin ?? null,
        salary_max: salaryMax ?? null,
        required_qualification: values.required_qualification?.trim() || null,
        required_institution_type: institution,
        required_experience_years: Number.isFinite(expYears) ? expYears : 0,
        required_specialization: values.required_specialization?.trim() || null,
        expires_at: expiresIso,
        max_applications: maxApps ?? null,
      })
      .eq('id', job.id)
      .eq('farm_id', auth.user.id)

    if (error) {
      setActionError(error.message)
      return
    }
    setEditing(false)
    await loadJob()
  }

  async function setJobStatus(next: 'active' | 'closed') {
    if (!job) return
    setToggling(true)
    setActionError('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setActionError('Not signed in')
      setToggling(false)
      return
    }
    const { error } = await supabase
      .from('jobs')
      .update({ status: next })
      .eq('id', job.id)
      .eq('farm_id', auth.user.id)
    setToggling(false)
    if (error) {
      setActionError(error.message)
      return
    }
    await loadJob()
  }

  function confirmDelete() {
    if (!job) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Close this job listing? Applicants will no longer see it as active.'
      )
    ) {
      return
    }
    void setJobStatus('closed')
  }

  if (job === undefined && !loadError) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">Loading job...</p>
      </div>
    )
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-gray-900">Job not found</h1>
          <p className="mt-2 text-gray-600">
            {loadError || 'This job does not exist or you do not have access.'}
          </p>
          <Link
            href="/dashboard/farm"
            className="mt-6 inline-block text-green-700 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const nextToggleStatus: 'active' | 'closed' | null =
    job.status === 'active' ? 'closed' : job.status === 'closed' ? 'active' : null

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard/farm"
              className="text-sm text-green-700 hover:underline"
            >
              Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <StatusBadge status={job.status} />
              <span>Applications: {job.application_count}</span>
              <span>Closes {formatDate(job.expires_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/farm/jobs/${job.id}/applications`}>
              <Button type="button" variant="outline" size="sm">
                View applications
              </Button>
            </Link>
            {nextToggleStatus ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={toggling}
                onClick={() => void setJobStatus(nextToggleStatus)}
              >
                {job.status === 'active' ? 'Close job' : 'Open job'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={toggling}
              onClick={confirmDelete}
            >
              Delete
            </Button>
            {!editing ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditing(true)
                  reset(jobToFormValues(job))
                }}
              >
                Edit
              </Button>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <p className="mb-4 text-sm text-red-600">{actionError}</p>
        ) : null}

        {!editing ? (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Job type</dt>
                  <dd className="mt-1">
                    <Pill variant="gray">{jobTypeLabel(job.job_type)}</Pill>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Location</dt>
                  <dd className="text-gray-800">{job.location}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Address</dt>
                  <dd className="text-gray-800">{job.address ?? '-'}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {job.description}
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Salary</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-4">
                  <dt className="font-medium text-gray-700">Minimum</dt>
                  <dd className="text-gray-800">
                    {job.salary_min != null ? job.salary_min : '-'}
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className="font-medium text-gray-700">Maximum</dt>
                  <dd className="text-gray-800">
                    {job.salary_max != null ? job.salary_max : '-'}
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className="font-medium text-gray-700">Currency</dt>
                  <dd className="text-gray-800">{job.salary_currency ?? 'GHS'}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Qualification</dt>
                  <dd className="text-gray-800">
                    {job.required_qualification ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Institution type</dt>
                  <dd className="text-gray-800">
                    {job.required_institution_type ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Experience (years)</dt>
                  <dd className="text-gray-800">
                    {job.required_experience_years ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Specialization</dt>
                  <dd className="text-gray-800">
                    {job.required_specialization ?? '-'}
                  </dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Max applications</dt>
                  <dd className="text-gray-800">
                    {job.max_applications != null ? job.max_applications : '-'}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        ) : (
          <form
            className="space-y-8"
            onSubmit={handleSubmit(onSave)}
          >
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Basic info</h2>
              <div className="mt-4 space-y-4">
                <Input
                  label="Title"
                  {...register('title')}
                  error={errors.title?.message}
                />
                <Textarea
                  label="Description"
                  {...register('description')}
                  error={errors.description?.message}
                />
                <Select
                  label="Job type"
                  options={JOB_TYPE_SELECT}
                  {...register('job_type')}
                  error={errors.job_type?.message}
                />
                <Select
                  label="Region (location)"
                  options={REGION_OPTIONS}
                  {...register('location')}
                  error={errors.location?.message}
                />
                <Input
                  label="Address (optional)"
                  {...register('address')}
                  error={errors.address?.message}
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
              <div className="mt-4 space-y-4">
                <Input
                  label="Required qualification (optional)"
                  {...register('required_qualification')}
                  error={errors.required_qualification?.message}
                />
                <Select
                  label="Required institution type (optional)"
                  options={institutionOptions}
                  {...register('required_institution_type')}
                  error={errors.required_institution_type?.message}
                />
                <Input
                  label="Required experience (years)"
                  type="number"
                  min={0}
                  step={1}
                  {...register('required_experience_years')}
                  error={errors.required_experience_years?.message}
                />
                <Input
                  label="Required specialization (optional)"
                  {...register('required_specialization')}
                  error={errors.required_specialization?.message}
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Salary</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Minimum (optional)"
                  type="number"
                  min={0}
                  step={1}
                  {...register('salary_min')}
                  error={errors.salary_min?.message}
                />
                <Input
                  label="Maximum (optional)"
                  type="number"
                  min={0}
                  step={1}
                  {...register('salary_max')}
                  error={errors.salary_max?.message}
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <div className="mt-4 space-y-4">
                <Input
                  label="Closing date"
                  type="date"
                  {...register('expires_at')}
                  error={errors.expires_at?.message}
                />
                <Input
                  label="Max applications (optional)"
                  type="number"
                  min={1}
                  step={1}
                  {...register('max_applications')}
                  error={errors.max_applications?.message}
                />
              </div>
            </Card>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  reset(jobToFormValues(job))
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
