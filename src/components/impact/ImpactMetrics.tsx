'use client'

import { useEffect, useState } from 'react'

interface Metric {
  value: number
  label: string
  suffix?: string
  prefix?: string
}

interface ImpactMetricsProps {
  variant?: 'default' | 'compact'
}

export function ImpactMetrics({ variant = 'default' }: ImpactMetricsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const metrics: Metric[] = [
    { value: 1250, label: 'Graduates Placed', suffix: '+' },
    { value: 180, label: 'Partner Farms', suffix: '+' },
    { value: 450, label: 'Students Trained', suffix: '+' },
    { value: 16, label: 'Regions Covered' }
  ]

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="text-center p-4 bg-white dark:bg-white/5 rounded-lg border border-primary/10"
          >
            <div className="text-2xl md:text-3xl font-bold text-primary dark:text-white mb-1">
              {metric.prefix}{isVisible ? metric.value.toLocaleString() : 0}{metric.suffix}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-white/5 dark:to-white/10 rounded-2xl border border-primary/20 dark:border-white/10"
        >
          <div className="text-4xl md:text-5xl font-black text-primary dark:text-white mb-2">
            {metric.prefix}{isVisible ? metric.value.toLocaleString() : 0}{metric.suffix}
          </div>
          <div className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  )
}
