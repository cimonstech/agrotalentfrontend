'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'

export function RelativeTime({ date }: { date: string | null | undefined }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!date) {
      setLabel('Recently')
      return
    }
    const update = () => setLabel(timeAgo(date))
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [date])

  return <span suppressHydrationWarning>{label}</span>
}
