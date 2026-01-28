import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: pageMetadata['help-center'].title,
  description: pageMetadata['help-center'].description,
  keywords: pageMetadata['help-center'].keywords,
  openGraph: {
    title: pageMetadata['help-center'].title,
    description: pageMetadata['help-center'].description,
    url: `${siteConfig.url}/help-center`,
  },
  alternates: {
    canonical: '/help-center',
  },
}

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
