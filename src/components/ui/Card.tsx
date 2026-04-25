'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
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
        'rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md',
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
  iconBg?: string
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-brand/10 text-brand',
  trend,
  className,
}: StatCardProps) {
  const trendTone =
    trend && trend.value < 0 ? 'text-red-500' : 'text-green-600'
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className='min-w-0'>
        <p className='text-xl font-bold text-gray-900'>{value}</p>
        <p className='mt-0.5 text-xs text-gray-400'>{label}</p>
        {trend ? (
          <p className={cn('mt-1 text-xs font-medium', trendTone)}>
            {trend.value > 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export type HeroCardStat = {
  label: string
  value: string | number
}

export type HeroCardProps = {
  title: string
  stats: HeroCardStat[]
  gradientFrom?: string
  gradientTo?: string
  backgroundImage?: string
  className?: string
}

export function HeroCard({
  title,
  stats,
  gradientFrom = '#0D3320',
  gradientTo = '#1A6B3C',
  backgroundImage,
  className,
}: HeroCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm',
        className
      )}
    >
      <div
        className='relative h-20 px-5 py-4 text-white'
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt=''
            fill
            className='object-cover object-center opacity-20'
            sizes='100vw'
          />
        ) : null}
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
            backgroundSize: '12px 12px',
          }}
        />
        <p className='text-sm font-semibold'>{title}</p>
      </div>
      <div className='p-5'>
        <div className='rounded-xl bg-white/10 p-3 backdrop-blur-sm'>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            {stats.map((s) => (
              <div key={s.label}>
                <p className='text-2xl font-bold text-gray-900'>{s.value}</p>
                <p className='mt-1 text-xs text-gray-400'>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export type ProgressCardItem = {
  label: string
  value: number
  status: 'done' | 'partial' | 'missing'
}

export type ProgressCardProps = {
  title: string
  items: ProgressCardItem[]
  className?: string
}

export function ProgressCard({ title, items, className }: ProgressCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm',
        className
      )}
    >
      <p className='text-sm font-semibold text-gray-900'>{title}</p>
      <div className='mt-4 space-y-4'>
        {items.map((item) => {
          const width =
            item.status === 'done'
              ? 100
              : item.status === 'partial'
                ? Math.max(0, Math.min(100, item.value))
                : 8
          const tone =
            item.status === 'done'
              ? 'bg-brand'
              : item.status === 'partial'
                ? 'bg-gold'
                : 'bg-red-400'
          return (
            <div key={item.label}>
              <div className='mb-1 flex items-center justify-between gap-2'>
                <p className='text-xs font-medium text-gray-600'>{item.label}</p>
                <p className='text-xs text-gray-400'>{Math.round(width)}%</p>
              </div>
              <div className='h-2 w-full rounded-full bg-gray-100'>
                <div
                  className={cn('h-2 rounded-full transition-all duration-500', tone)}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
