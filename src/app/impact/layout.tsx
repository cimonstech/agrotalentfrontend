import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata.impact.title,
  description: pageMetadata.impact.description,
  keywords: pageMetadata.impact.keywords,
  openGraph: {
    title: pageMetadata.impact.title,
    description: pageMetadata.impact.description,
    url: `${siteConfig.url}/impact`,
  },
  alternates: {
    canonical: '/impact',
  },
}

export default function ImpactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
