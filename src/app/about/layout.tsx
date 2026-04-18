import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'About AgroTalent Hub | Agricultural Recruitment Platform Ghana',
  description:
    'Learn about AgroTalent Hub, the platform connecting verified agricultural graduates with modern farms across Ghana.',
}

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
