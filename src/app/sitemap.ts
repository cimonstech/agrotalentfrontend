import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

/** Regenerate periodically so new jobs appear in /sitemap.xml without redeploying. */
export const revalidate = 3600

function siteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
  return raw.replace(/\/+$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteBaseUrl()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let jobUrls: MetadataRoute.Sitemap = []

  if (url && serviceKey) {
    const supabase = createClient(url, serviceKey)
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .is('deleted_at', null)
      .is('hidden_at', null)
      .order('created_at', { ascending: false })
      .limit(1000)

    jobUrls = (jobs ?? []).map((job) => ({
      url: siteUrl + '/jobs/' + job.id,
      lastModified: new Date(job.updated_at ?? job.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: siteUrl + '/jobs',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: siteUrl + '/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: siteUrl + '/services',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: siteUrl + '/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: siteUrl + '/for-farms',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: siteUrl + '/for-graduates',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: siteUrl + '/for-students',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: siteUrl + '/for-skilled',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: siteUrl + '/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: siteUrl + '/signin',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: siteUrl + '/privacy-policy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: siteUrl + '/terms-of-service',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: siteUrl + '/post-job',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: siteUrl + '/impact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.45,
    },
  ]

  return [...staticPages, ...jobUrls]
}
