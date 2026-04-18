'use client'

import type { ReactNode } from 'react'
import { cn, STATUS_COLORS } from '@/lib/utils'

export type StatusBadgeProps = {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = status.toLowerCase()
  const color =
    STATUS_COLORS[key] ?? 'bg-gray-100 text-gray-700'
  const text = label ?? status
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        color,
        className
      )}
    >
      {text}
    </span>
  )
}

export type PillProps = {
  children: ReactNode
  variant?: 'green' | 'gray' | 'yellow' | 'red' | 'blue'
  className?: string
}

const pillVariants: Record<NonNullable<PillProps['variant']>, string> = {
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
}

export function Pill({
  children,
  variant = 'gray',
  className,
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        pillVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
