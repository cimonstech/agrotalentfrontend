'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'

export function RelativeTime({ date }: { date: string | null | undefined }) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    setLabel(timeAgo(date))
    const interval = setInterval(() => {
      setLabel(timeAgo(date))
    }, 60000)
    return () => clearInterval(interval)
  }, [date])

  if (!label) return null
  return <span>{label}</span>
}
