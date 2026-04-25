'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Profile } from '@/types'

type CheckDef = {
  field: keyof Profile
  label: string
  points: number
}

const GRADUATE_CHECKS: CheckDef[] = [
  { field: 'full_name', label: 'Full name', points: 10 },
  { field: 'phone', label: 'Phone number', points: 5 },
  { field: 'preferred_region', label: 'Preferred region', points: 15 },
  { field: 'institution_name', label: 'Institution name', points: 10 },
  { field: 'qualification', label: 'Qualification', points: 10 },
  { field: 'specialization', label: 'Specialization', points: 10 },
  { field: 'graduation_year', label: 'Graduation year', points: 5 },
  { field: 'cv_url', label: 'CV uploaded', points: 15 },
  { field: 'certificate_url', label: 'Certificate uploaded', points: 15 },
  { field: 'nss_status', label: 'NSS status set', points: 5 },
]

const SKILLED_CHECKS: CheckDef[] = [
  { field: 'full_name', label: 'Full name', points: 10 },
  { field: 'phone', label: 'Phone number', points: 10 },
  { field: 'preferred_region', label: 'Preferred region', points: 15 },
  { field: 'years_of_experience', label: 'Years of experience', points: 15 },
  { field: 'specialization', label: 'Specialization', points: 15 },
  { field: 'skills', label: 'Skills listed', points: 15 },
  { field: 'experience_description', label: 'Experience description', points: 10 },
  { field: 'cv_url', label: 'CV uploaded', points: 10 },
]

const FARM_CHECKS: CheckDef[] = [
  { field: 'full_name', label: 'Contact name', points: 10 },
  { field: 'phone', label: 'Phone number', points: 25 },
  { field: 'farm_name', label: 'Farm name', points: 15 },
  { field: 'farm_type', label: 'Farm type', points: 10 },
  { field: 'farm_location', label: 'Farm location', points: 20 },
  { field: 'farm_address', label: 'Farm address', points: 10 },
  { field: 'email', label: 'Email address', points: 10 },
]

function isFieldComplete(profile: Profile, field: keyof Profile): boolean {
  const v = profile[field]
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (typeof v === 'number') return !Number.isNaN(v)
  if (Array.isArray(v)) return v.length > 0
  return true
}

/** CV / certificate often live in `documents` while legacy strength used `profiles.*_url` only. */
function isCheckSatisfied(
  profile: Profile,
  c: CheckDef,
  hasCvDocument?: boolean,
  hasCertificateDocument?: boolean,
  hasSupportingDocuments?: boolean
): boolean {
  if (c.field === 'cv_url') {
    return isFieldComplete(profile, 'cv_url') || Boolean(hasCvDocument)
  }
  if (c.field === 'certificate_url') {
    return (
      isFieldComplete(profile, 'certificate_url') ||
      Boolean(hasCertificateDocument) ||
      (profile.role === 'student' && Boolean(hasSupportingDocuments))
    )
  }
  return isFieldComplete(profile, c.field)
}

function getChecksForRole(role: Profile['role']): CheckDef[] {
  if (role === 'graduate' || role === 'student') return GRADUATE_CHECKS
  if (role === 'skilled') return SKILLED_CHECKS
  if (role === 'farm') return FARM_CHECKS
  return []
}

function statusSubtext(percentage: number): string {
  if (percentage >= 80) return 'Strong: you are ready to apply'
  if (percentage >= 60) return 'Good: a few more details will help'
  if (percentage >= 40) return 'Fair: complete your profile to improve matches'
  return 'Weak: incomplete profiles get lower match scores'
}

function pctTextClass(percentage: number): string {
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 60) return 'text-brand'
  if (percentage >= 40) return 'text-amber-500'
  return 'text-red-500'
}

function barClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-brand'
  if (percentage >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

export interface ProfileStrengthProps {
  profile: Profile
  className?: string
  /** Counts toward “CV uploaded” if `profiles.cv_url` is empty but a `documents` row exists. */
  hasCvDocument?: boolean
  /** Counts toward “Certificate uploaded” when applicable for the role. */
  hasCertificateDocument?: boolean
  /** Student: transcript / NSS letter rows count toward the certificate line. */
  hasSupportingDocuments?: boolean
}

function ProfileStrength({
  profile,
  className = '',
  hasCvDocument,
  hasCertificateDocument,
  hasSupportingDocuments,
}: ProfileStrengthProps) {
  const checks = getChecksForRole(profile.role)
  if (checks.length === 0) return null

  const totalPossible = checks.reduce((sum, c) => sum + c.points, 0)
  let score = 0
  for (const c of checks) {
    if (
      isCheckSatisfied(
        profile,
        c,
        hasCvDocument,
        hasCertificateDocument,
        hasSupportingDocuments
      )
    ) {
      score += c.points
    }
  }
  const percentage =
    totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0

  const incomplete = checks.filter(
    (c) =>
      !isCheckSatisfied(
        profile,
        c,
        hasCvDocument,
        hasCertificateDocument,
        hasSupportingDocuments
      )
  )
  const shown = incomplete.slice(0, 4)
  const remaining = incomplete.length - shown.length

  const profilePath = '/dashboard/' + profile.role + '/profile'

  const outer = `${className} bg-white rounded-2xl border border-gray-100 p-5`.trim()

  if (percentage === 100) {
    return (
      <div className={outer}>
        <div className='flex items-start gap-3'>
          <CheckCircle
            className='h-5 w-5 shrink-0 text-green-500'
            aria-hidden
          />
          <div>
            <p className='text-sm font-semibold text-green-700'>Profile Complete</p>
            <p className='mt-1 text-xs text-gray-500'>
              Your profile is fully set up and ready for matching.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={outer}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-semibold text-gray-800'>Profile Strength</p>
          <p className='mt-0.5 text-xs text-gray-400'>{statusSubtext(percentage)}</p>
        </div>
        <p className={`text-2xl font-bold ${pctTextClass(percentage)}`}>
          {percentage}%
        </p>
      </div>

      <div className='mt-3 h-2.5 w-full rounded-full bg-gray-100'>
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${barClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {incomplete.length > 0 ? (
        <div className='mt-4'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
            Complete your profile
          </p>
          <ul>
            {shown.map((c) => (
              <li
                key={`${String(c.field)}-${c.label}`}
                className='flex items-center gap-2 py-1.5'
              >
                <span
                  className='h-4 w-4 shrink-0 rounded-full border-2 border-gray-200'
                  aria-hidden
                />
                <span className='text-sm text-gray-500'>{c.label}</span>
                <span className='ml-auto text-xs text-gray-300'>+{c.points} pts</span>
              </li>
            ))}
          </ul>
          {remaining > 0 ? (
            <p className='mt-1 text-xs text-gray-400'>+ {remaining} more items</p>
          ) : null}
        </div>
      ) : null}

      <div className='mt-4'>
        <Link
          href={profilePath}
          className='flex items-center gap-1 text-xs font-semibold text-brand hover:underline'
        >
          Complete Profile
          <svg
            className='h-3 w-3'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            aria-hidden
          >
            <path d='M5 12h14M13 6l6 6-6 6' />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export { ProfileStrength }
export default ProfileStrength
