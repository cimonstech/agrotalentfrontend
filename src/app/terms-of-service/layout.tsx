import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['terms-of-service'].title,
  description: pageMetadata['terms-of-service'].description,
  keywords: pageMetadata['terms-of-service'].keywords,
  openGraph: {
    title: pageMetadata['terms-of-service'].title,
    description: pageMetadata['terms-of-service'].description,
    url: `${siteConfig.url}/terms-of-service`,
  },
  alternates: {
    canonical: '/terms-of-service',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
