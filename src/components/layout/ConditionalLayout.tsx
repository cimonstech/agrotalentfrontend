'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'
import { Footer } from './Footer'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')

  if (isDashboard) {
    return <>{children}</>
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navigation />
      {children}
      <Footer />
    </div>
  )
}
