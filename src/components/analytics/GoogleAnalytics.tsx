'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-46MJ6M58GR'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return
    const path = pathname || window.location.pathname
    const fullUrl = `${window.location.origin}${path}${window.location.search || ''}`
    // Track page view for every route change (all public pages: /, /jobs, /about, etc.)
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_location: fullUrl,
      page_title: document.title,
    })
  }, [pathname])

  return null
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
