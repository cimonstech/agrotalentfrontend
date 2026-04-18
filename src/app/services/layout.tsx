import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Our Services | AgroTalent Hub',
  description:
    'Recruitment, training, internship placement, and data collection services for Ghana\'s agricultural sector.',
}

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
