'use client'

import { useCallback, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GHANA_REGIONS } from '@/lib/locations'
import type { Job, JobBenefits } from '@/types'

const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  job_type: z.enum([
    'farm_hand',
    'farm_manager',
    'intern',
    'nss',
    'data_collector',
  ]),
  location: z
    .string()
    .min(1, 'Location is required')
    .refine(
      (v) => (GHANA_REGIONS as readonly string[]).includes(v),
      'Select a valid region'
    ),
  city: z.string().optional(),
  address: z.string().optional(),
  required_qualification: z.string().optional(),
  required_institution_type: z
    .union([
      z.enum(['university', 'training_college', 'any']),
      z.literal(''),
    ])
    .optional(),
  required_specialization: z.string().optional(),
  required_experience_years: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).optional()
  ),
  salary_min: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).optional()
  ),
  salary_max: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).optional()
  ),
  salary_currency: z.string().optional(),
  max_applications: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(1).optional()
  ),
  expires_at: z.string().optional(),
  contract_type: z
    .union([
      z.enum(['permanent', 'contract', 'seasonal', 'casual']),
      z.literal(''),
    ])
    .optional(),
  accommodation_provided: z.boolean().default(false),
  commission_included: z.boolean().default(false),
  commission_percentage: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(0).max(100).optional()
  ),
  is_sourced_job: z.boolean().default(false),
  source_name: z.string().max(200).optional(),
  source_contact: z.string().max(200).optional(),
  source_phone: z.string().max(20).optional(),
  source_email: z
    .union([z.string().email(), z.literal('')])
    .optional(),
  application_method: z.enum(['platform', 'external']).default('platform'),
  external_apply_url: z
    .union([z.string().url(), z.literal('')])
    .optional(),
  acceptable_regions: z.array(z.string()).optional(),
  acceptable_cities: z.array(z.string()).optional(),
})

export type JobFormValues = z.infer<typeof jobSchema>

const defaultBenefitsState = {
  accommodation: false,
  meals: false,
  meal_amount: null as number | null,
  transport: false,
  commission: false,
  commission_percentage: null as number | null,
  health_care: false,
  internet_data: false,
  uniform: false,
  annual_leave_days: null as number | null,
  other: '',
}

export type JobBenefitsFormState = typeof defaultBenefitsState

export function useJobForm(defaultValues?: Partial<JobFormValues>) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as Resolver<JobFormValues>,
    defaultValues: {
      salary_currency: 'GHS',
      required_experience_years: 0,
      city: '',
      contract_type: '',
      accommodation_provided: false,
      commission_included: false,
      is_sourced_job: false,
      application_method: 'platform',
      source_name: '',
      source_contact: '',
      source_phone: '',
      source_email: '',
      external_apply_url: '',
      ...defaultValues,
    },
  })

  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [responsibilitiesHtml, setResponsibilitiesHtml] = useState('')
  const [requirementsHtml, setRequirementsHtml] = useState('')
  const [benefits, setBenefits] = useState<JobBenefitsFormState>({
    ...defaultBenefitsState,
  })
  const [acceptableRegions, setAcceptableRegions] = useState<string[]>([])
  const [acceptableCities, setAcceptableCities] = useState<string[]>([])
  const [confidence, setConfidence] = useState<
    Record<string, 'high' | 'medium' | 'low' | null>
  >({})
  const [aiGeneratedFields, setAiGeneratedFields] = useState<Set<string>>(
    new Set()
  )
  const [generatingField, setGeneratingField] = useState<
    'description' | 'responsibilities' | 'requirements' | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const seedBenefitsFromJob = useCallback((job: Job) => {
    const b = job.benefits as JobBenefits | null | undefined
    if (b && typeof b === 'object') {
      setBenefits({
        accommodation: Boolean(b.accommodation),
        meals: Boolean(b.meals),
        meal_amount:
          b.meal_amount != null && Number.isFinite(Number(b.meal_amount))
            ? Number(b.meal_amount)
            : null,
        transport: Boolean(b.transport),
        commission: Boolean(b.commission),
        commission_percentage:
          b.commission_percentage != null &&
          Number.isFinite(Number(b.commission_percentage))
            ? Number(b.commission_percentage)
            : job.commission_percentage != null &&
                Number.isFinite(Number(job.commission_percentage))
              ? Number(job.commission_percentage)
              : null,
        health_care: Boolean(b.health_care),
        internet_data: Boolean(b.internet_data),
        uniform: Boolean(b.uniform),
        annual_leave_days:
          b.annual_leave_days != null &&
          Number.isFinite(Number(b.annual_leave_days))
            ? Number(b.annual_leave_days)
            : null,
        other: typeof b.other === 'string' ? b.other : '',
      })
      return
    }
    setBenefits({
      ...defaultBenefitsState,
      accommodation: Boolean(job.accommodation_provided),
      commission: Boolean(job.commission_included),
      commission_percentage:
        job.commission_percentage != null &&
        Number.isFinite(Number(job.commission_percentage))
          ? Number(job.commission_percentage)
          : null,
    })
  }, [])

  const fillFormFromAI = useCallback(
    (data: Record<string, unknown>) => {
      const conf = (data.confidence as Record<string, string>) ?? {}
      const { setValue } = form

      if (data.title) setValue('title', data.title as string)
      if (data.job_type) {
        setValue('job_type', data.job_type as JobFormValues['job_type'])
      }
      if (data.location) setValue('location', data.location as string)
      if (data.city != null) setValue('city', String(data.city))
      if (data.qualification) {
        setValue('required_qualification', data.qualification as string)
      }
      if (data.specialization) {
        setValue('required_specialization', data.specialization as string)
      }
      if (data.salary_min != null) setValue('salary_min', data.salary_min as number)
      if (data.salary_max != null) setValue('salary_max', data.salary_max as number)
      if (data.experience_years != null) {
        setValue(
          'required_experience_years',
          data.experience_years as number
        )
      }
      if (data.max_applications != null) {
        setValue('max_applications', data.max_applications as number)
      }
      if (data.address) setValue('address', data.address as string)

      if (data.description) setDescriptionHtml(data.description as string)
      if (data.responsibilities) {
        setResponsibilitiesHtml(data.responsibilities as string)
      }
      if (data.requirements) setRequirementsHtml(data.requirements as string)

      setConfidence({
        title: (conf.title as 'high' | 'medium' | 'low') ?? null,
        job_type: (conf.job_type as 'high' | 'medium' | 'low') ?? null,
        location: (conf.location as 'high' | 'medium' | 'low') ?? null,
        description: (conf.description as 'high' | 'medium' | 'low') ?? null,
        salary_min: (conf.salary_min as 'high' | 'medium' | 'low') ?? null,
        salary_max: (conf.salary_max as 'high' | 'medium' | 'low') ?? null,
        experience_years:
          (conf.experience_years as 'high' | 'medium' | 'low') ?? null,
        qualification:
          (conf.qualification as 'high' | 'medium' | 'low') ?? null,
      })
    },
    [form]
  )

  const handleGenerateContent = useCallback(
    async (field: 'description' | 'responsibilities' | 'requirements') => {
      const title = form.getValues('title')
      if (!title) {
        alert('Please enter a job title first')
        return
      }
      setGeneratingField(field)
      try {
        const res = await fetch('/api/jobs/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field,
            jobTitle: title,
            jobType: form.getValues('job_type'),
            location: form.getValues('location'),
            qualification: form.getValues('required_qualification'),
            specialization: form.getValues('required_specialization'),
            experienceYears: form.getValues('required_experience_years'),
          }),
        })
        const data = await res.json()
        if (data.success && data.html) {
          if (field === 'description') setDescriptionHtml(data.html)
          if (field === 'responsibilities') setResponsibilitiesHtml(data.html)
          if (field === 'requirements') setRequirementsHtml(data.html)
          setAiGeneratedFields((prev) => {
            const next = new Set(prev)
            next.add(field)
            return next
          })
        }
      } catch (err) {
        console.error('Generate error:', err)
      }
      setGeneratingField(null)
    },
    [form]
  )

  return {
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
    seedBenefitsFromJob,
    confidence,
    setConfidence,
    aiGeneratedFields,
    setAiGeneratedFields,
    generatingField,
    isSubmitting,
    setIsSubmitting,
    submitSuccess,
    setSubmitSuccess,
    submitError,
    setSubmitError,
    fillFormFromAI,
    handleGenerateContent,
  }
}
