'use client'

import { Navigation } from './Navigation'
import { Footer } from './Footer'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col font-ubuntu">
      <Navigation />
      <div className="w-full flex-1 pt-16">{children}</div>
      <Footer />
    </div>
  )
}
