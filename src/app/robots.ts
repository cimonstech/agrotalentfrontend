import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'

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
