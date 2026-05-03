import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { JobStructuredData } from './JobStructuredData'
import { buildJobOgImageUrl } from './job-seo-og'
import type { JobSeoRow } from './job-seo-types'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

async function resolveParams(params: Props['params']) {
  return 'then' in params && typeof (params as Promise<{ id: string }>).then === 'function'
    ? await (params as Promise<{ id: string }>)
    : (params as { id: string })
}

async function getJobForSeo(id: string): Promise<JobSeoRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  const supabase = createClient(url, serviceKey)
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      description,
      location,
      city,
      job_type,
      salary_min,
      salary_max,
      salary_currency,
      required_qualification,
      required_specialization,
      image_url,
      created_at,
      expires_at,
      benefits,
      is_platform_job,
      profiles!jobs_farm_id_fkey ( farm_name )
    `
    )
    .eq('id', id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .is('hidden_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data as JobSeoRow
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
  const { id } = await resolveParams(params)
  const job = await getJobForSeo(id)

  if (!job) {
    return {
      title: 'Job Not Found | AgroTalent Hub',
    }
  }

  const locationText = job.city ? job.city + ', ' + job.location : job.location
  const title = job.title + ' | ' + locationText + ' | AgroTalent Hub'

  const rawDesc = (job.description ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const description =
    rawDesc.slice(0, 160) ||
    'Apply for ' +
      job.title +
      ' in ' +
      locationText +
      ' on AgroTalent Hub - Ghana\'s agricultural talent platform.'

  const ogImageUrl = buildJobOgImageUrl(job, siteUrl)

  const canonicalUrl = siteUrl + '/jobs/' + id

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: job.title + ' - ' + locationText,
      description,
      url: canonicalUrl,
      siteName: 'AgroTalent Hub',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: job.title + ' - ' + locationText,
        },
      ],
      type: 'website',
      locale: 'en_GH',
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title + ' | AgroTalent Hub',
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function JobDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Props['params']
}) {
  const { id } = await resolveParams(params)
  const job = await getJobForSeo(id)

  const normalizedJob =
    job &&
    ({
      ...job,
      profiles: Array.isArray(job.profiles) ? job.profiles[0] : job.profiles,
    } as JobSeoRow)

  return (
    <>
      {normalizedJob ? <JobStructuredData job={normalizedJob} /> : null}
      {children}
    </>
  )
}
