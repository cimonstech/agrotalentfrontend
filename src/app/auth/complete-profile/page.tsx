'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { GHANA_REGIONS } from '@/lib/utils'
import type { UserRole } from '@/types'

const supabase = createSupabaseClient()

const ROLES: {
  value: UserRole
  label: string
  desc: string
  icon: string
}[] = [
  {
    value: 'farm',
    label: 'Farm / Employer',
    desc: 'I want to hire agricultural talent',
    icon: '🌾',
  },
  {
    value: 'graduate',
    label: 'Graduate',
    desc: 'I have a degree in agriculture',
    icon: '🎓',
  },
  {
    value: 'student',
    label: 'Student',
    desc: 'I am looking for NSS or internship',
    icon: '📚',
  },
  {
    value: 'skilled',
    label: 'Skilled Worker',
    desc: 'I have hands-on farm experience',
    icon: '🔧',
  },
]

const DASHBOARD_BY_ROLE: Record<string, string> = {
  farm: '/dashboard/farm',
  graduate: '/dashboard/graduate',
  student: '/dashboard/student',
  skilled: '/dashboard/skilled',
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{
    id: string
    email?: string | null
    user_metadata?: { full_name?: string }
  } | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({
    full_name: '',
    phone: '',
    farm_name: '',
    farm_location: '',
    institution_name: '',
    preferred_region: '',
    years_of_experience: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser()
        if (cancelled) return
        if (!u) {
          router.replace('/signin')
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .maybeSingle()
        if (cancelled) return
        if (profile?.role) {
          const dest = DASHBOARD_BY_ROLE[profile.role as string]
          if (dest) {
            router.replace(dest)
            return
          }
        }
        setUser(u)
        setFormData((prev) => ({
          ...prev,
          full_name:
            (u.user_metadata?.full_name as string | undefined) ||
            prev.full_name ||
            '',
        }))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return
    setError('')
    setSubmitting(true)
    try {
      const {
        data: { user: current },
      } = await supabase.auth.getUser()
      if (!current?.email) {
        setError('Session expired. Please sign in again.')
        setSubmitting(false)
        return
      }

      const role = selectedRole as UserRole
      const payload: Record<string, unknown> = {
        id: current.id,
        email: current.email,
        full_name: formData.full_name.trim(),
        phone: formData.phone?.trim() || null,
        role,
        is_verified: false,
      }

      if (role === 'farm') {
        payload.farm_name = formData.farm_name.trim()
        payload.farm_location = formData.farm_location || null
      } else if (role === 'graduate' || role === 'student') {
        payload.institution_name = formData.institution_name.trim()
        payload.preferred_region = formData.preferred_region || null
        if (role === 'student') {
          payload.nss_status = 'not_applicable'
        }
      } else if (role === 'skilled') {
        const y = parseInt(formData.years_of_experience, 10)
        payload.years_of_experience = Number.isFinite(y) ? y : 0
        payload.preferred_region = formData.preferred_region || null
      }

      const { error: upErr } = await supabase.from('profiles').upsert(payload)
      if (upErr) {
        setError(upErr.message)
        setSubmitting(false)
        return
      }

      const dest = DASHBOARD_BY_ROLE[role]
      if (dest) {
        router.push(dest)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 bg-cream font-ubuntu">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream px-6 py-16 font-ubuntu">
      <div className="mx-auto max-w-lg">
        {step === 1 ? (
          <>
            <div className="text-center">
              <Image
                src="/agrotalent-logo.webp"
                alt=""
                width={48}
                height={48}
                className="mx-auto"
              />
              <h1 className="mt-4 text-center text-2xl font-bold text-forest">
                Complete Your Profile
              </h1>
              <p className="mt-2 text-center text-gray-500">
                Choose how you will use AgroTalent Hub
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {ROLES.map((r) => {
                const selected = selectedRole === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all ${
                      selected
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 hover:border-brand/50'
                    }`}
                  >
                    <div className="mb-2 text-3xl" aria-hidden>
                      {r.icon}
                    </div>
                    <div className="text-sm font-bold text-forest">{r.label}</div>
                    <div className="mt-1 text-xs text-gray-400">{r.desc}</div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!selectedRole}
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-brand hover:underline"
            >
              Back
            </button>

            <h2 className="mt-4 text-xl font-bold text-forest">Your details</h2>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, full_name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone (optional)
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              {selectedRole === 'farm' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Farm name
                    </label>
                    <input
                      required
                      value={formData.farm_name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, farm_name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Farm location
                    </label>
                    <select
                      required
                      value={formData.farm_location}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          farm_location: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="">Select region</option>
                      {GHANA_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              {selectedRole === 'graduate' || selectedRole === 'student' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Institution name
                    </label>
                    <input
                      required
                      value={formData.institution_name}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          institution_name: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Preferred region
                    </label>
                    <select
                      value={formData.preferred_region}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          preferred_region: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="">Select region</option>
                      {GHANA_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              {selectedRole === 'skilled' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Years of experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      required
                      value={formData.years_of_experience}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          years_of_experience: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Preferred region
                    </label>
                    <select
                      value={formData.preferred_region}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          preferred_region: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                    >
                      <option value="">Select region</option>
                      {GHANA_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : null}
                Complete Setup
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
