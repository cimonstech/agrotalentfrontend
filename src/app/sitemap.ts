import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url
  const currentDate = new Date()

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/services',
    '/jobs',
    '/for-farms',
    '/for-graduates',
    '/for-skilled',
    '/for-students',
    '/impact',
    '/contact',
    '/help-center',
    '/privacy-policy',
    '/terms-of-service',
    '/signup',
    '/signin',
  ]

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: path === '' ? 'daily' : path.includes('jobs') ? 'hourly' : 'weekly',
    priority: path === '' ? 1.0 : path.includes('jobs') || path.includes('for-') ? 0.9 : 0.8,
  }))
}
