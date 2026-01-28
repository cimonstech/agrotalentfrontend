import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata.jobs.title,
  description: pageMetadata.jobs.description,
  keywords: pageMetadata.jobs.keywords,
  openGraph: {
    title: pageMetadata.jobs.title,
    description: pageMetadata.jobs.description,
    url: `${siteConfig.url}/jobs`,
  },
  alternates: {
    canonical: '/jobs',
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
