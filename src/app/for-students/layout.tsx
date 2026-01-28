import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['for-students'].title,
  description: pageMetadata['for-students'].description,
  keywords: pageMetadata['for-students'].keywords,
  openGraph: {
    title: pageMetadata['for-students'].title,
    description: pageMetadata['for-students'].description,
    url: `${siteConfig.url}/for-students`,
  },
  alternates: {
    canonical: '/for-students',
  },
}

export default function ForStudentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
