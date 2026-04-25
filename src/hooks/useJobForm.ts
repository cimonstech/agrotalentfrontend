'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { GHANA_REGIONS } from '@/lib/utils'

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
  address: z.string().optional(),
  required_qualification: z.string().optional(),
  required_institution_type: z
    .enum(['university', 'training_college', 'any'])
    .optional(),
  required_specialization: z.string().optional(),
  required_experience_years: z.coerce.number().min(0).optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  salary_currency: z.string().optional(),
  max_applications: z.coerce.number().int().min(1).optional(),
  expires_at: z.string().optional(),
})

export type JobFormValues = z.infer<typeof jobSchema>

export function useJobForm(defaultValues?: Partial<JobFormValues>) {
  const form = useForm<JobFormValues>({
    defaultValues: {
      salary_currency: 'GHS',
      required_experience_years: 0,
      ...defaultValues,
    },
  })

  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [responsibilitiesHtml, setResponsibilitiesHtml] = useState('')
  const [requirementsHtml, setRequirementsHtml] = useState('')
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

  const fillFormFromAI = useCallback(
    (data: Record<string, unknown>) => {
      const conf = (data.confidence as Record<string, string>) ?? {}
      const { setValue } = form

      if (data.title) setValue('title', data.title as string)
      if (data.job_type) {
        setValue('job_type', data.job_type as JobFormValues['job_type'])
      }
      if (data.location) setValue('location', data.location as string)
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
