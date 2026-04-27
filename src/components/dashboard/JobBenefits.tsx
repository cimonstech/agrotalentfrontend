'use client'

import type { ReactNode } from 'react'
import type { Job, JobBenefits as JobBenefitsShape } from '@/types'
import {
  Calendar,
  Car,
  Heart,
  Home,
  Percent,
  Plus,
  Shirt,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react'

interface JobBenefitsProps {
  job: Job
}

const iconMap: Record<string, ReactNode> = {
  home: <Home className='h-3.5 w-3.5' />,
  utensils: <UtensilsCrossed className='h-3.5 w-3.5' />,
  car: <Car className='h-3.5 w-3.5' />,
  percent: <Percent className='h-3.5 w-3.5' />,
  heart: <Heart className='h-3.5 w-3.5' />,
  wifi: <Wifi className='h-3.5 w-3.5' />,
  shirt: <Shirt className='h-3.5 w-3.5' />,
  calendar: <Calendar className='h-3.5 w-3.5' />,
  plus: <Plus className='h-3.5 w-3.5' />,
}

export default function JobBenefits({ job }: JobBenefitsProps) {
  if (!job.benefits && !job.accommodation_provided && !job.commission_included) {
    return null
  }

  const benefits = (job.benefits ?? {}) as Partial<JobBenefitsShape>
  const accommodation =
    Boolean(benefits.accommodation) || Boolean(job.accommodation_provided)
  const commission =
    Boolean(benefits.commission) || Boolean(job.commission_included)
  const commissionPct =
    benefits.commission_percentage != null
      ? benefits.commission_percentage
      : job.commission_percentage

  const activeBenefits = [
    accommodation && { label: 'Accommodation', icon: 'home' },
    benefits.meals && {
      label: benefits.meal_amount
        ? 'Meals (GHS ' + benefits.meal_amount + '/mo)'
        : 'Meals',
      icon: 'utensils',
    },
    benefits.transport && { label: 'Transport', icon: 'car' },
    commission && {
      label: commissionPct
        ? commissionPct + '% Commission'
        : 'Commission',
      icon: 'percent',
    },
    benefits.health_care && { label: 'Health Care', icon: 'heart' },
    benefits.internet_data && { label: 'Internet / Data', icon: 'wifi' },
    benefits.uniform && { label: 'Uniform', icon: 'shirt' },
    benefits.annual_leave_days && {
      label: benefits.annual_leave_days + ' Days Leave',
      icon: 'calendar',
    },
    benefits.other && { label: benefits.other, icon: 'plus' },
  ].filter(Boolean) as { label: string; icon: string }[]

  if (activeBenefits.length === 0) return null

  return (
    <div className='mt-5'>
      <h3 className='mb-3 text-sm font-bold text-gray-900'>
        Benefits and Perks
      </h3>
      <div className='flex flex-wrap gap-2'>
        {activeBenefits.map((item, i) => (
          <span
            key={i}
            className='flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700'
          >
            <span className='flex shrink-0 text-green-700' aria-hidden>
              {iconMap[item.icon]}
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
