import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata.services.title,
  description: pageMetadata.services.description,
  keywords: pageMetadata.services.keywords,
  openGraph: {
    title: pageMetadata.services.title,
    description: pageMetadata.services.description,
    url: `${siteConfig.url}/services`,
  },
  alternates: {
    canonical: '/services',
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
