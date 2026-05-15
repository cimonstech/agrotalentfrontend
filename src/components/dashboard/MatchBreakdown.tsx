'use client'

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export interface MatchFactor {
  name: string
  status: 'match' | 'partial' | 'missing'
  points: number
  maxPoints: number
  detail: string
}

export interface MatchBreakdownData {
  total: number
  factors: MatchFactor[]
}

export function MatchBreakdown({ breakdown }: { breakdown: MatchBreakdownData }) {
  return (
    <div className='mt-4'>
      <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400'>
        Score Breakdown
      </p>
      <div className='flex flex-wrap gap-2'>
        {breakdown.factors.map((factor) => {
          const isMatch = factor.status === 'match'
          const isPartial = factor.status === 'partial'

          return (
            <div
              key={factor.name}
              title={factor.detail}
              className={[
                'group relative flex cursor-default items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                isMatch
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : isPartial
                    ? 'border border-amber-200 bg-amber-50 text-amber-700'
                    : 'border border-red-200 bg-red-50 text-red-600',
              ].join(' ')}
            >
              {isMatch ? (
                <CheckCircle2 className='h-3.5 w-3.5 shrink-0' />
              ) : isPartial ? (
                <AlertCircle className='h-3.5 w-3.5 shrink-0' />
              ) : (
                <XCircle className='h-3.5 w-3.5 shrink-0' />
              )}
              <span>{factor.name}</span>
              <span className='opacity-60'>
                {factor.points}/{factor.maxPoints}
              </span>

              <div className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2 text-center text-[11px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100'>
                {factor.detail}
                <div className='absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900' />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
