import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { BackToTop } from '@/components/layout/BackToTop'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { AbortErrorHandler } from '@/components/AbortErrorHandler'
import { AbortErrorBoundary } from '@/components/AbortErrorBoundary'
import { siteConfig, allKeywords, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo'

const ubuntu = Ubuntu({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ubuntu',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: allKeywords,
  authors: [{ name: 'AgroTalent Hub' }],
  creator: 'AgroTalent Hub',
  publisher: 'AgroTalent Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
  alternates: {
    canonical: siteConfig.url,
  },
  category: 'Agriculture',
  icons: {
    icon: '/favicon.ico',
    apple: '/agrotalent-logo.webp',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebSiteSchema()

  return (
    <html lang="en" className={ubuntu.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/agrotalent-logo.webp" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2d5016" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgroTalent Hub" />
        {/* Suppress AbortError from Supabase auth-js - capture phase so we run before Next.js overlay */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.addEventListener("unhandledrejection",function(e){var r=e.reason;if(r&&(r.name==="AbortError"||(r.message&&/signal is aborted|aborted without reason/i.test(r.message)))){e.preventDefault();e.stopImmediatePropagation();}},true);',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/<\/script/gi, '<\\/script'),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/<\/script/gi, '<\\/script'),
          }}
        />
      </head>
      <body className={`${ubuntu.variable} font-sans bg-background-light dark:bg-background-dark text-[#101914] dark:text-white antialiased`}>
        <AbortErrorHandler />
        <GoogleAnalytics />
        <AbortErrorBoundary>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <BackToTop />
        </AbortErrorBoundary>
      </body>
    </html>
  )
}
