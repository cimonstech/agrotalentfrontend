'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle, Circle, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { Profile } from '@/types'

export type OnboardingStep = {
  id: string
  label: string
  description: string
  href: string
  completed: boolean
}

export function getGraduateSteps(
  profile: Profile,
  hasApplied?: boolean
): OnboardingStep[] {
  return [
    {
      id: 'complete_profile',
      label: 'Complete your profile',
      description:
        'Add your institution, qualification, and preferred region',
      href: '/dashboard/graduate/profile',
      completed: !!(
        profile.institution_name &&
        profile.qualification &&
        profile.preferred_region
      ),
    },
    {
      id: 'upload_cv',
      label: 'Upload your CV',
      description: 'A CV increases your match score and visibility to farms',
      href: '/dashboard/graduate/documents',
      completed: !!profile.cv_url,
    },
    {
      id: 'upload_certificate',
      label: 'Upload your certificate',
      description: 'Verified certificates unlock full platform access',
      href: '/dashboard/graduate/documents',
      completed: !!profile.certificate_url,
    },
    {
      id: 'browse_jobs',
      label: 'Browse available jobs',
      description: 'Find roles matched to your region and qualifications',
      href: '/dashboard/graduate/jobs',
      completed: false,
    },
    {
      id: 'apply_job',
      label: 'Submit your first application',
      description: 'Apply to a job that matches your skills and location',
      href: '/dashboard/graduate/jobs',
      completed: hasApplied ?? false,
    },
  ]
}

export function getSkilledSteps(
  profile: Profile,
  hasApplied?: boolean
): OnboardingStep[] {
  const yoe =
    profile.years_of_experience != null &&
    !Number.isNaN(Number(profile.years_of_experience))
  const spec = !!(profile.specialization && String(profile.specialization).trim())
  const region = !!(
    profile.preferred_region && String(profile.preferred_region).trim()
  )
  const skillsDone = !!(profile.skills && String(profile.skills).trim())

  return [
    {
      id: 'complete_profile',
      label: 'Complete your profile',
      description:
        'Add your experience, specialization, and preferred region',
      href: '/dashboard/skilled/profile',
      completed: yoe && spec && region,
    },
    {
      id: 'upload_cv',
      label: 'Upload your CV',
      description: 'A CV increases your match score and visibility to farms',
      href: '/dashboard/skilled/documents',
      completed: !!profile.cv_url,
    },
    {
      id: 'add_skills',
      label: 'Add your skills',
      description: 'List skills so farms can see what you bring',
      href: '/dashboard/skilled/profile',
      completed: skillsDone,
    },
    {
      id: 'browse_jobs',
      label: 'Browse available jobs',
      description: 'Find roles matched to your region and qualifications',
      href: '/dashboard/skilled/jobs',
      completed: false,
    },
    {
      id: 'apply_job',
      label: 'Submit your first application',
      description: 'Apply to a job that matches your skills and location',
      href: '/dashboard/skilled/jobs',
      completed: hasApplied ?? false,
    },
  ]
}

export function getStudentSteps(profile: Profile): OnboardingStep[] {
  return [
    {
      id: 'complete_profile',
      label: 'Complete your profile',
      description: 'Add your institution and preferred region',
      href: '/dashboard/student/profile',
      completed: !!(
        profile.institution_name &&
        profile.preferred_region &&
        String(profile.institution_name).trim() &&
        String(profile.preferred_region).trim()
      ),
    },
    {
      id: 'browse_jobs',
      label: 'Browse available jobs',
      description: 'Find internships and NSS roles that fit you',
      href: '/dashboard/student/jobs',
      completed: false,
    },
    {
      id: 'training',
      label: 'Explore training',
      description: 'See upcoming sessions and resources',
      href: '/dashboard/student/training',
      completed: false,
    },
    {
      id: 'apply_job',
      label: 'Submit your first application',
      description: 'Apply to a role that matches your goals',
      href: '/dashboard/student/jobs',
      completed: false,
    },
  ]
}

export function getFarmSteps(
  profile: Profile,
  hasPostedJob?: boolean
): OnboardingStep[] {
  return [
    {
      id: 'complete_profile',
      label: 'Complete your farm profile',
      description: 'Add your farm name, type, and location',
      href: '/dashboard/farm/profile',
      completed: !!(
        profile.farm_name &&
        profile.farm_type &&
        profile.farm_location
      ),
    },
    {
      id: 'post_job',
      label: 'Post your first job',
      description: 'Describe the role and let verified candidates apply',
      href: '/dashboard/farm/jobs/new',
      completed: hasPostedJob ?? false,
    },
    {
      id: 'review_applications',
      label: 'Review applications',
      description: 'Check match scores and shortlist the best candidates',
      href: '/dashboard/farm/applications',
      completed: false,
    },
    {
      id: 'verify_account',
      label: 'Get your account verified',
      description: 'Admin verification unlocks job posting for your farm',
      href: '/dashboard/farm/profile',
      completed: !!profile.is_verified,
    },
  ]
}

function stepsForProfile(
  profile: Profile,
  hasApplied?: boolean,
  hasPostedJob?: boolean
): OnboardingStep[] {
  if (profile.role === 'graduate') {
    return getGraduateSteps(profile, hasApplied)
  }
  if (profile.role === 'skilled') {
    return getSkilledSteps(profile, hasApplied)
  }
  if (profile.role === 'student') {
    return getStudentSteps(profile)
  }
  if (profile.role === 'farm') {
    return getFarmSteps(profile, hasPostedJob)
  }
  return []
}

export interface OnboardingChecklistProps {
  profile: Profile
  hasApplied?: boolean
  hasPostedJob?: boolean
}

export default function OnboardingChecklist({
  profile,
  hasApplied,
  hasPostedJob,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [mounted, setMounted] = useState(false)

  const storageKey = 'ath-onboarding-dismissed-' + profile.id

  useEffect(() => {
    setMounted(true)
    try {
      if (typeof window !== 'undefined') {
        const v = window.localStorage.getItem(storageKey)
        if (v === 'true') setDismissed(true)
      }
    } catch {
      /* ignore */
    }
  }, [storageKey])

  const steps = stepsForProfile(profile, hasApplied, hasPostedJob)
  const completedCount = steps.filter((s) => s.completed).length
  const totalCount = steps.length
  const allDone = totalCount > 0 && completedCount === totalCount

  function dismissChecklist() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, 'true')
      }
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (!mounted || dismissed || allDone || totalCount === 0) {
    return null
  }

  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className='relative mb-6 rounded-2xl bg-gradient-to-br from-forest to-brand p-5'>
      <button
        type='button'
        onClick={dismissChecklist}
        className='absolute right-3 top-3 text-white/60 hover:text-white'
        aria-label='Dismiss checklist'
      >
        <X className='h-4 w-4' aria-hidden />
      </button>

      <div className='mb-4 flex items-center justify-between pr-8'>
        <div>
          <p className='text-base font-bold text-white'>Get Started</p>
          <p className='mt-0.5 text-xs text-white/70'>
            Complete these steps to get the most out of AgroTalent Hub
          </p>
        </div>
        <div className='rounded-full bg-white/20 px-3 py-1'>
          <span className='text-xs font-bold text-white'>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className='mb-4 h-1.5 w-full rounded-full bg-white/20'>
        <div
          className='h-1.5 rounded-full bg-gold transition-all duration-500'
          style={{ width: `${pct}%` }}
        />
      </div>

      <button
        type='button'
        onClick={() => setExpanded((e) => !e)}
        className='mb-3 flex items-center gap-1 text-xs text-white/70 hover:text-white'
      >
        {expanded ? (
          <ChevronUp className='h-3 w-3' aria-hidden />
        ) : (
          <ChevronDown className='h-3 w-3' aria-hidden />
        )}
        {expanded ? 'Hide steps' : 'Show steps'}
      </button>

      {expanded ? (
        <ul className='space-y-2'>
          {steps.map((step) => (
            <li key={step.id} className='flex items-start gap-3'>
              {step.completed ? (
                <CheckCircle
                  className='mt-0.5 h-5 w-5 flex-shrink-0 text-gold'
                  aria-hidden
                />
              ) : (
                <Circle
                  className='mt-0.5 h-5 w-5 flex-shrink-0 text-white/40'
                  aria-hidden
                />
              )}
              <div>
                {step.completed ? (
                  <p className='text-sm text-white/60 line-through'>
                    {step.label}
                  </p>
                ) : (
                  <>
                    <Link
                      href={step.href}
                      className='text-sm font-medium text-white transition-colors hover:text-gold'
                    >
                      {step.label}
                    </Link>
                    <p className='mt-0.5 text-xs text-white/60'>
                      {step.description}
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className='mt-4 border-t border-white/15 pt-4'>
        <p className='text-xs text-white/50'>
          You can dismiss this checklist at any time using the X button above.
        </p>
      </div>
    </div>
  )
}
