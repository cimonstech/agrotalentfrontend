import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Our Impact | AgroTalent Hub',
  description:
    'See how AgroTalent Hub is transforming Ghana\'s agricultural workforce through verified placements and training.',
}

export default function ImpactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
