import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { pageMetadata } from '@/lib/seo'
import HomePageClient from './home-client'

export const metadata: Metadata = {
  title: pageMetadata.home.title,
  description: pageMetadata.home.description,
  keywords: pageMetadata.home.keywords,
  openGraph: {
    title: pageMetadata.home.title,
    description: pageMetadata.home.description,
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
}

function getTimeAgo(date: string) {
  const now = Date.now()
  const posted = new Date(date).getTime()
  const diffInSeconds = Math.floor((now - posted) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

export default async function HomePage() {
  let initialJobs: Array<{
    id: string
    title: string
    company: string
    location: string
    salary: string
    type: string
    posted: string
    description: string
    requirements: string[]
  }> = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const supabase = createClient(url, key)
      const { data } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          location,
          salary_min,
          salary_max,
          job_type,
          description,
          created_at,
          profiles:farm_id ( farm_name )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4)
      const raw = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.profiles?.farm_name || 'AgroTalent Hub',
        location: job.location,
        salary:
          job.salary_min && job.salary_max
            ? `GHS ${job.salary_min} - ${job.salary_max}`
            : job.salary_min
              ? `GHS ${job.salary_min}+`
              : 'Salary negotiable',
        type: (job.job_type || '').replace('_', ' ') || 'Full-time',
        posted: getTimeAgo(job.created_at),
        description: job.description || '',
        requirements: [],
      }))
      initialJobs = raw
    }
  } catch {
    // Prefetch is best-effort; client will fetch if empty
  }
  return <HomePageClient initialJobPostings={initialJobs} />
}
