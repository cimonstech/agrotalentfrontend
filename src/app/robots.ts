import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
  const siteUrl = raw.replace(/\/+$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/dev-token',
          '/sentry-example-page',
        ],
      },
    ],
    sitemap: siteUrl + '/sitemap.xml',
    host: siteUrl,
  }
}
