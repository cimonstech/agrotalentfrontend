'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'
import { GHANA_REGIONS, GHANA_CITIES } from '@/lib/locations'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import type { Profile, UserRole } from '@/types'

export const dynamic = 'force-dynamic'

const supabase = createSupabaseClient()

const regionOptions = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

const farmTypeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'agro_processing', label: 'Agro processing' },
  { value: 'research', label: 'Research' },
]

const institutionTypeOptions = [
  { value: 'university', label: 'University' },
  { value: 'training_college', label: 'Training college' },
]

const nssStatusOptions = [
  { value: 'not_applicable', label: 'Not Applicable' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active / In Progress' },
  { value: 'completed', label: 'Completed' },
]

const specializationOptions = [
  { value: 'crop', label: 'Crop' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'agribusiness', label: 'Agribusiness' },
  { value: 'other', label: 'Other' },
]

const baseSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
})

const farmTypeEnum = z.enum([
  'small',
  'medium',
  'large',
  'agro_processing',
  'research',
])

const institutionEnum = z.enum(['university', 'training_college'])
const specializationEnum = z.enum(['crop', 'livestock', 'agribusiness', 'other'])

const farmSchema = baseSchema.extend({
  farm_name: z.string().min(2, 'Farm name is required'),
  farm_type: farmTypeEnum,
  farm_location: z.string().min(1, 'Farm location is required'),
  city: z.string().optional(),
})

const graduateSchema = baseSchema.extend({
  institution_name: z.string().min(1, 'Institution name is required'),
  institution_type: institutionEnum,
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: specializationEnum,
  graduation_year: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z
      .number({ message: 'Graduation year is required' })
      .min(1990, 'Graduation year is required')
      .max(2030, 'Graduation year is required')
  ),
  preferred_region: z.string().min(1, 'Preferred region is required'),
  city: z.string().min(1, 'City is required'),
})

const studentSchema = baseSchema.extend({
  institution_name: z.string().min(1, 'Institution name is required'),
  institution_type: institutionEnum,
  preferred_region: z.string().min(1, 'Select a region'),
  city: z.string().min(1, 'City is required'),
  nss_status: z.enum(['not_applicable', 'pending', 'active', 'completed'], {
    message: 'NSS status is required',
  }),
})

const skilledSchema = baseSchema.extend({
  years_of_experience: z.coerce.number().min(0, 'Years of experience is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  preferred_region: z.string().min(1, 'Preferred region is required'),
  city: z.string().min(1, 'City is required'),
})

export type SignupFormValues = {
  full_name: string
  email: string
  password: string
  phone?: string
  farm_name?: string
  farm_type?: z.infer<typeof farmTypeEnum>
  farm_location?: string
  institution_name?: string
  institution_type?: z.infer<typeof institutionEnum>
  qualification?: string
  specialization?: string
  graduation_year?: number
  preferred_region?: string
  city?: string
  years_of_experience?: number
  nss_status?: 'not_applicable' | 'pending' | 'active' | 'completed'
}

const signupSchemas = {
  farm: farmSchema,
  graduate: graduateSchema,
  student: studentSchema,
  skilled: skilledSchema,
} as const satisfies Record<SignupRole, z.ZodType<SignupFormValues>>

type SignupRole = 'farm' | 'graduate' | 'student' | 'skilled'

function headingForRole(role: SignupRole): string {
  switch (role) {
    case 'farm':
      return 'Create Farm Account'
    case 'graduate':
      return 'Graduate Registration'
    case 'student':
      return 'Student Registration'
    case 'skilled':
      return 'Skilled Worker Registration'
    default:
      return 'Create Account'
  }
}

export default function SignUpRolePage() {
  const router = useRouter()
  const params = useParams()
  const roleParam = params.role as string

  const role = useMemo(() => {
    if (['farm', 'graduate', 'student', 'skilled'].includes(roleParam)) {
      return roleParam as SignupRole
    }
    return null
  }, [roleParam])

  const resolver = useMemo((): Resolver<SignupFormValues> | undefined => {
    if (!role) return undefined
    // zod v4 + @hookform/resolvers: schema input/output generics differ from FieldValues
    return zodResolver(signupSchemas[role] as never) as Resolver<SignupFormValues>
  }, [role])

  const isSubmitting = useRef(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<SignupFormValues>({
    resolver,
    defaultValues: {
      full_name: '',
    email: '',
    password: '',
    phone: '',
    farm_name: '',
      farm_type: undefined,
    farm_location: '',
    institution_name: '',
      institution_type: undefined,
    qualification: '',
      specialization: undefined,
      graduation_year: undefined,
    preferred_region: '',
      city: '',
      years_of_experience: undefined,
      nss_status: undefined,
    },
  })

  const farmLocationWatch = watch('farm_location')
  const preferredRegionWatch = watch('preferred_region')

  useEffect(() => {
    if (role === null) {
      router.replace('/signup')
    }
  }, [role, router])

  const onSubmit = async (values: SignupFormValues) => {
    if (isSubmitting.current) return
    isSubmitting.current = true
    setLoading(true)
    try {
      if (!role) return
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role,
            full_name: values.full_name,
          },
        },
      })

      if (signUpError) {
        setError('root', { message: signUpError.message })
        return
      }

      const user = authData.user
      if (!user) {
        router.push('/verify-email')
        return
      }

      const baseProfile: Partial<Profile> & { id: string; email: string; role: UserRole } = {
        id: user.id,
        email: values.email,
        full_name: values.full_name,
        role,
        phone: values.phone?.trim() || null,
      }

      let extra: Partial<Profile> = {}

      if (role === 'farm') {
        extra = {
          farm_name: values.farm_name!,
          farm_type: values.farm_type!,
          farm_location: values.farm_location!,
          city: values.city?.trim() || null,
        }
      } else if (role === 'graduate') {
        extra = {
          institution_name: values.institution_name!,
          institution_type: values.institution_type!,
          qualification: values.qualification || null,
          specialization: values.specialization!,
          graduation_year: values.graduation_year ?? null,
          preferred_region: values.preferred_region!,
          city: values.city!,
        }
      } else if (role === 'student') {
        extra = {
          institution_name: values.institution_name!,
          institution_type: values.institution_type!,
          preferred_region: values.preferred_region!,
          city: values.city!,
          nss_status: values.nss_status!,
        }
      } else if (role === 'skilled') {
        extra = {
          years_of_experience: values.years_of_experience!,
          specialization: values.specialization!,
          preferred_region: values.preferred_region!,
          city: values.city!,
        }
      }

      const upsertPayload = { ...baseProfile, ...extra }

      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upsertPayload),
      })
      const resData = await res.json()

      if (!res.ok) {
        const msg = resData.error ?? 'Profile creation failed'
        setError('root', { message: msg })
        return
      }

      router.push('/verify-email')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setError('root', { message: msg })
    } finally {
      isSubmitting.current = false
      setLoading(false)
    }
  }

  if (!role) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-800">{headingForRole(role)}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Already registered?{' '}
            <Link href="/signin" className="font-medium text-green-800 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-sm">
            <Link href="/signup" className="font-medium text-green-800 hover:underline">
              Choose a different account type
            </Link>
          </p>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errors.root?.message ? (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {errors.root.message}
                {errors.root.message.includes('already exists') ? (
                  <span>
                    {' '}
                    <Link href="/signin" className="font-semibold underline">
                      Sign in
                    </Link>
                  </span>
                ) : null}
              </div>
            ) : null}

            <Input
              label="Full name"
              autoComplete="name"
              {...register('full_name')}
              error={errors.full_name?.message}
            />
            <Input
              label="Email"
                  type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              error={errors.phone?.message}
            />

            {role === 'farm' ? (
              <>
                <Input
                  label="Farm name *"
                  {...register('farm_name')}
                  error={errors.farm_name?.message}
                />
                <Select
                  label="Farm type *"
                  placeholder="Select farm type"
                  options={farmTypeOptions}
                  {...register('farm_type')}
                  error={errors.farm_type?.message}
                />
                <Select
                  label="Farm location (region) *"
                  placeholder="Select region"
                  options={regionOptions}
                  {...register('farm_location', {
                    onChange: () => setValue('city', ''),
                  })}
                  error={errors.farm_location?.message}
                />
                {farmLocationWatch ? (
                  <Select
                    label="Farm City / Town"
                    placeholder="Select city"
                    options={[
                      { value: '', label: 'Select city' },
                      ...(GHANA_CITIES[farmLocationWatch] ?? []).map((c) => ({
                        value: c,
                        label: c,
                      })),
                      { value: 'other', label: 'Other' },
                    ]}
                    {...register('city')}
                    error={errors.city?.message}
                  />
                ) : null}
              </>
            ) : null}

            {role === 'graduate' ? (
              <>
                <Input
                  label="Institution name *"
                  {...register('institution_name')}
                  error={errors.institution_name?.message}
                />
                <Select
                  label="Institution type *"
                  placeholder="Select type"
                  options={institutionTypeOptions}
                  {...register('institution_type')}
                  error={errors.institution_type?.message}
                />
                <Input
                  label="Qualification *"
                  {...register('qualification')}
                  error={errors.qualification?.message}
                />
                <Select
                  label="Specialization *"
                  placeholder="Select specialization"
                  options={specializationOptions}
                  {...register('specialization')}
                  error={errors.specialization?.message}
                />
                <Input
                  label="Graduation year *"
                  type="number"
                  {...register('graduation_year')}
                  error={
                    typeof errors.graduation_year?.message === 'string'
                      ? errors.graduation_year.message
                      : undefined
                  }
                />
                <Select
                  label="Preferred region *"
                  placeholder="Select region"
                  options={regionOptions}
                  {...register('preferred_region', {
                    onChange: () => setValue('city', ''),
                  })}
                  error={errors.preferred_region?.message}
                />
                {preferredRegionWatch ? (
                  <Select
                    label="Your City / Town *"
                    placeholder="Select city"
                    options={[
                      { value: '', label: 'Select city' },
                      ...(GHANA_CITIES[preferredRegionWatch] ?? []).map((c) => ({
                        value: c,
                        label: c,
                      })),
                      { value: 'other', label: 'Other' },
                    ]}
                    {...register('city')}
                    error={errors.city?.message}
                  />
                ) : null}
              </>
            ) : null}

            {role === 'student' ? (
              <>
                <Input
                  label="Institution name *"
                  {...register('institution_name')}
                  error={errors.institution_name?.message}
                />
                <Select
                  label="Institution type *"
                  placeholder="Select type"
                  options={institutionTypeOptions}
                  {...register('institution_type')}
                  error={errors.institution_type?.message}
                />
                <Select
                  label="Preferred region *"
                  placeholder="Select region"
                  options={regionOptions}
                  {...register('preferred_region', {
                    onChange: () => setValue('city', ''),
                  })}
                  error={errors.preferred_region?.message}
                />
                {preferredRegionWatch ? (
                  <Select
                    label="Your City / Town *"
                    placeholder="Select city"
                    options={[
                      { value: '', label: 'Select city' },
                      ...(GHANA_CITIES[preferredRegionWatch] ?? []).map((c) => ({
                        value: c,
                        label: c,
                      })),
                      { value: 'other', label: 'Other' },
                    ]}
                    {...register('city')}
                    error={errors.city?.message}
                  />
                ) : null}
                <Select
                  label="NSS Status *"
                  placeholder="Select NSS status"
                  options={nssStatusOptions}
                  {...register('nss_status')}
                  error={errors.nss_status?.message}
                />
              </>
            ) : null}

            {role === 'skilled' ? (
              <>
                <Input
                  label="Years of experience *"
                        type="number"
                  min={0}
                  {...register('years_of_experience')}
                  error={errors.years_of_experience?.message}
                />
                <Select
                  label="Specialization *"
                  placeholder="Select specialization"
                  options={specializationOptions}
                  {...register('specialization')}
                  error={errors.specialization?.message}
                />
                <Select
                  label="Preferred region *"
                  placeholder="Select region"
                  options={regionOptions}
                  {...register('preferred_region', {
                    onChange: () => setValue('city', ''),
                  })}
                  error={errors.preferred_region?.message}
                />
                {preferredRegionWatch ? (
                  <Select
                    label="Your City / Town *"
                    placeholder="Select city"
                    options={[
                      { value: '', label: 'Select city' },
                      ...(GHANA_CITIES[preferredRegionWatch] ?? []).map((c) => ({
                        value: c,
                        label: c,
                      })),
                      { value: 'other', label: 'Other' },
                    ]}
                    {...register('city')}
                    error={errors.city?.message}
                  />
                ) : null}
              </>
            ) : null}

            <Button
                  type="submit"
              variant="primary"
              className="mt-4 w-full"
                  disabled={loading}
              loading={loading}
            >
              Create account
            </Button>
            <p className='mt-2 text-center text-xs text-gray-400'>
              Fields marked with <span className='text-red-500'>*</span> are required
            </p>
          </form>
        </Card>
          </div>
    </div>
  )
}
