'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Application } from '@/types'

const PIPELINE = [
  {
    status: 'pending' as const,
    label: 'Applied',
    desc: 'Your application has been received',
  },
  {
    status: 'reviewing' as const,
    label: 'Under Review',
    desc: 'The farm is reviewing your application',
  },
  {
    status: 'shortlisted' as const,
    label: 'Shortlisted',
    desc: 'You have been shortlisted for this role',
  },
  {
    status: 'accepted' as const,
    label: 'Accepted',
    desc: 'Congratulations! Your application was accepted',
  },
]

const REJECTED_STEP = {
  status: 'rejected' as const,
  label: 'Not Selected',
  desc: 'Your application was not successful this time',
}

export interface ApplicationTimelineProps {
  application: Application
  className?: string
}

function ApplicationTimeline({
  application,
  className = '',
}: ApplicationTimelineProps) {
  if (application.status === 'rejected') {
    return (
      <div
        className={`flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 ${className}`.trim()}
      >
        <span className='sr-only'>{REJECTED_STEP.label}</span>
        <XCircle
          className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400'
          aria-hidden
        />
        <div>
          <p className='text-sm font-semibold text-red-700'>Application Closed</p>
          <p className='mt-1 text-xs text-red-500'>
            This application was not successful.
          </p>
          {application.review_notes ? (
            <p className='mt-2 text-xs italic text-red-600'>
              {'"' + application.review_notes + '"'}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const currentIdx = PIPELINE.findIndex((s) => s.status === application.status)
  const activeIndex = currentIdx >= 0 ? currentIdx : 0

  return (
    <div className={`relative ${className}`.trim()}>
      <span className='sr-only'>
        Submitted {formatDate(application.created_at)}
      </span>
      <div className='absolute bottom-5 left-[15px] top-5 z-0 w-0.5 bg-gray-100' />
      <div className='relative z-10'>
        {PIPELINE.map((step, index) => {
          let mode: 'completed' | 'active' | 'upcoming'
          if (index < activeIndex) mode = 'completed'
          else if (index === activeIndex) mode = 'active'
          else mode = 'upcoming'

          const labelClass =
            mode === 'completed'
              ? 'text-gray-800'
              : mode === 'active'
                ? 'text-brand'
                : 'text-gray-400'

          const descClass =
            mode === 'upcoming' ? 'text-gray-300' : 'text-gray-500'

          return (
            <div
              key={step.status}
              className='relative z-10 flex items-start gap-3 pb-5 last:pb-0'
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  mode === 'completed'
                    ? 'border-brand bg-brand'
                    : mode === 'active'
                      ? 'border-brand bg-white'
                      : 'border-gray-200 bg-white'
                }`}
              >
                {mode === 'completed' ? (
                  <CheckCircle className='h-4 w-4 text-white' aria-hidden />
                ) : mode === 'active' ? (
                  <span className='h-3 w-3 animate-pulse rounded-full bg-brand' />
                ) : (
                  <span className='h-3 w-3 rounded-full bg-gray-200' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <p className={`text-sm font-semibold ${labelClass}`}>{step.label}</p>
                <p className={`mt-0.5 text-xs ${descClass}`}>{step.desc}</p>
                {mode === 'active' && application.updated_at ? (
                  <p className='mt-1 text-xs text-brand/70'>
                    {'Updated ' + timeAgo(application.updated_at)}
                  </p>
                ) : null}
                {mode === 'active' && application.review_notes ? (
                  <div className='mt-2 rounded-lg bg-blue-50 px-3 py-2'>
                    <p className='text-xs italic text-blue-700'>
                      {'"' + application.review_notes + '"'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ApplicationTimeline
