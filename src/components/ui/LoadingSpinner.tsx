'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

export type LoadingSpinnerProps = {
  size?: keyof typeof sizeMap
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex w-full items-center justify-center py-12', className)}
      role="status"
      aria-label="Loading"
    >
      <Loader2
        className={cn('animate-spin text-green-700', sizeMap[size])}
        aria-hidden
      />
    </div>
  )
}
