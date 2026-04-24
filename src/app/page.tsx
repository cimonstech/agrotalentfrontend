import type { Metadata } from 'next'
import { Suspense } from 'react'
import { pageMetadata } from '@/lib/seo'
import HomeClient from './home-client'

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

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  )
}
