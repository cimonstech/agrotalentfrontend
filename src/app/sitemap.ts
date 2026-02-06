import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

async function getJobUrls(): Promise<{ url: string; lastModified: Date }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return []

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(url, serviceKey)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: jobs, error } = await client
      .from('jobs')
      .select('id, updated_at, status, status_changed_at')
      .or('status.eq.active,and(status.eq.inactive,status_changed_at.gte.' + twentyFourHoursAgo + ')')

    if (error || !jobs?.length) return []

    const baseUrl = siteConfig.url
    return jobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.id}`,
      lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url
  const currentDate = new Date()

  const staticPages: MetadataRoute.Sitemap = [
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
  ].map((path) => {
    const changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] =
      path === '' ? 'daily' : path.includes('jobs') ? 'hourly' : 'weekly'
    return {
      url: `${baseUrl}${path}`,
      lastModified: currentDate,
      changeFrequency,
      priority: path === '' ? 1.0 : path.includes('jobs') || path.includes('for-') ? 0.9 : 0.8,
    }
  })

  const jobEntries = await getJobUrls()
  const jobUrls: MetadataRoute.Sitemap = jobEntries.map(({ url, lastModified }) => ({
    url,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...jobUrls]
}
