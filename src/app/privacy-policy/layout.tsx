import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['privacy-policy'].title,
  description: pageMetadata['privacy-policy'].description,
  keywords: pageMetadata['privacy-policy'].keywords,
  openGraph: {
    title: pageMetadata['privacy-policy'].title,
    description: pageMetadata['privacy-policy'].description,
    url: `${siteConfig.url}/privacy-policy`,
  },
  alternates: {
    canonical: '/privacy-policy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
