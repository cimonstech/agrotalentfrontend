import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Contact Us | AgroTalent Hub',
  description: 'Get in touch with AgroTalent Hub. We respond within 24 hours.',
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
