import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/+$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/signin',
          '/signup',
          '/forgot-password',
          '/auth/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/signin',
          '/signup',
          '/forgot-password',
          '/auth/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
