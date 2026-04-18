import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Browse Agricultural Jobs in Ghana | AgroTalent Hub',
  description:
    'Find verified agricultural jobs across all 16 regions of Ghana. Farm hands, managers, NSS, internships and more.',
}

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
