'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'
import { GHANA_REGIONS, JOB_TYPES } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

export default function FarmNewJobPage() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      required_experience_years: '0',
      required_institution_type: '',
    },
  })

  async function onSubmit(values: JobFormValues) {
    setSubmitError('')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) {
      setSubmitError('You must be signed in to post a job')
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

    const { data: inserted, error } = await supabase
      .from('jobs')
      .insert({
        farm_id: auth.user.id,
        title: values.title,
        description: values.description,
        job_type: values.job_type,
        location: values.location,
        address: values.address?.trim() || null,
        salary_min: salaryMin ?? null,
        salary_max: salaryMax ?? null,
        salary_currency: 'GHS',
        required_qualification: values.required_qualification?.trim() || null,
        required_institution_type: institution,
        required_experience_years: Number.isFinite(expYears) ? expYears : 0,
        required_specialization: values.required_specialization?.trim() || null,
        status: 'active',
        application_count: 0,
        expires_at: expiresIso,
        max_applications: maxApps ?? null,
      })
      .select('id')
      .single()

    if (error) {
      setSubmitError(error.message)
      return
    }

    if (inserted?.id) {
      router.push(`/dashboard/farm/jobs/${inserted.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Post a new job</h1>
        <p className="mt-1 text-sm text-gray-600">
          Describe the role and requirements. You can edit or close it later.
        </p>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
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

          {submitError ? (
            <p className="text-sm text-red-600">{submitError}</p>
          ) : null}

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish job'}
          </Button>
        </form>
      </div>
    </div>
  )
}
