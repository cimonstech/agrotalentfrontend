'use client'

import { usePathname } from 'next/navigation'
import { PublicLayout } from './PublicLayout'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const skipChrome =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/auth')

  if (skipChrome) {
    return <>{children}</>
  }

  return <PublicLayout>{children}</PublicLayout>
}
