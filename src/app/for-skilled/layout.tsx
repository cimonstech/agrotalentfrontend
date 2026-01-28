import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['for-skilled'].title,
  description: pageMetadata['for-skilled'].description,
  keywords: pageMetadata['for-skilled'].keywords,
  openGraph: {
    title: pageMetadata['for-skilled'].title,
    description: pageMetadata['for-skilled'].description,
    url: `${siteConfig.url}/for-skilled`,
  },
  alternates: {
    canonical: '/for-skilled',
  },
}

export default function ForSkilledLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
