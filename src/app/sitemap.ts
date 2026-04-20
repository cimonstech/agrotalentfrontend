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

const STATIC_PATHS: { path: string; priority: number }[] = [
  { path: '', priority: 1.0 },
  { path: '/jobs', priority: 0.9 },
  { path: '/about', priority: 0.8 },
  { path: '/services', priority: 0.8 },
  { path: '/contact', priority: 0.8 },
  { path: '/for-farms', priority: 0.8 },
  { path: '/for-graduates', priority: 0.8 },
  { path: '/for-students', priority: 0.8 },
  { path: '/for-skilled', priority: 0.8 },
  { path: '/signup', priority: 0.8 },
  { path: '/signin', priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url
  const lastModified = new Date()

  const staticPages: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
  }))

  const jobEntries = await getJobUrls()
  const jobUrls: MetadataRoute.Sitemap = jobEntries.map(({ url, lastModified: lm }) => ({
    url,
    lastModified: lm,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...jobUrls]
}
