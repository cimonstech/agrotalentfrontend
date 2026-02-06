import type { Metadata } from 'next'
import { siteConfig, allKeywords } from '@/lib/seo'
import { JobStructuredData } from './JobStructuredData'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

async function getJobForMetadata(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, serviceKey)
  const { data, error } = await client
    .from('jobs')
    .select(
      `
      id,
      title,
      description,
      location,
      job_type,
      created_at,
      status,
      status_changed_at,
      salary_min,
      salary_max,
      profiles:farm_id ( farm_name )
    `
    )
    .eq('id', id)
    .single()
  if (error || !data) return null
  if (data.status === 'inactive' && data.status_changed_at) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (new Date(data.status_changed_at) <= cutoff) return null
  }
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = 'then' in params && typeof (params as Promise<{ id: string }>).then === 'function'
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string })
  const { id } = resolved
  const job = await getJobForMetadata(id)
  const jobUrl = `${siteConfig.url}/jobs/${id}`

  if (!job) {
    return {
      title: `Job Opportunity | AgroTalent Hub`,
      description: `Agricultural and farming job in Ghana. Find opportunities on AgroTalent Hub.`,
      openGraph: { url: jobUrl, title: 'Agricultural Job | AgroTalent Hub' },
      alternates: { canonical: `/jobs/${id}` },
    }
  }

  const profile = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles
  const farmName = (profile as { farm_name?: string } | null)?.farm_name || 'Farm'
  const plainDesc = (job.description || '')
    .replace(/<[^>]*>/g, '')
    .slice(0, 160)
  const title = `${job.title} | ${farmName} | AgroTalent Hub`
  const description =
    plainDesc ||
    `Apply for ${job.title} at ${farmName} in ${job.location}. Agricultural jobs in Ghana.`

  return {
    title,
    description,
    keywords: [
      ...allKeywords,
      job.title,
      job.location,
      'agricultural job Ghana',
      'farming job',
    ],
    openGraph: {
      title,
      description,
      url: jobUrl,
      type: 'website',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/jobs/${id}`,
    },
  }
}

export default async function JobDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolved = 'then' in params && typeof (params as Promise<{ id: string }>).then === 'function'
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string })
  const job = await getJobForMetadata(resolved.id)

  const normalizedJob =
    job && {
      ...job,
      profiles: Array.isArray(job.profiles) ? job.profiles[0] : job.profiles,
    }

  return (
    <>
      {normalizedJob && <JobStructuredData job={normalizedJob} />}
      {children}
    </>
  )
}
