'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export type CardProps = {
  children: ReactNode
  className?: string
  padding?: keyof typeof paddingMap
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

export type StatCardProps = {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      {icon ? (
        <div className="rounded-lg bg-green-50 p-2 text-green-700">{icon}</div>
      ) : null}
    </div>
  )
}
