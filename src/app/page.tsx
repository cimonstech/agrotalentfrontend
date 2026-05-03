import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import HomePage from '@/components/marketing/HomePage'

export const metadata: Metadata = {
  title: pageMetadata.home.title,
  description: pageMetadata.home.description,
  keywords: pageMetadata.home.keywords,
  openGraph: {
    title: pageMetadata.home.title,
    description: pageMetadata.home.description,
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
}

export default function Page() {
  return <HomePage />
}
