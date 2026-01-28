import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['for-graduates'].title,
  description: pageMetadata['for-graduates'].description,
  keywords: pageMetadata['for-graduates'].keywords,
  openGraph: {
    title: pageMetadata['for-graduates'].title,
    description: pageMetadata['for-graduates'].description,
    url: `${siteConfig.url}/for-graduates`,
  },
  alternates: {
    canonical: '/for-graduates',
  },
}

export default function ForGraduatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
