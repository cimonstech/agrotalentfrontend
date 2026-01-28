import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['for-farms'].title,
  description: pageMetadata['for-farms'].description,
  keywords: pageMetadata['for-farms'].keywords,
  openGraph: {
    title: pageMetadata['for-farms'].title,
    description: pageMetadata['for-farms'].description,
    url: `${siteConfig.url}/for-farms`,
  },
  alternates: {
    canonical: '/for-farms',
  },
}

export default function ForFarmsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
