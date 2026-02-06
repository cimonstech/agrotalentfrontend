import { siteConfig } from '@/lib/seo'

type Job = {
  id: string
  title: string
  description: string
  location: string
  job_type?: string
  created_at: string
  salary_min?: number
  salary_max?: number
  profiles?: { farm_name?: string }
}

export function JobStructuredData({ job }: { job: Job }) {
  const baseSalary =
    job.salary_min != null || job.salary_max != null
      ? {
          '@type': 'MonetaryAmount' as const,
          currency: 'GHS' as const,
          value: {
            '@type': 'QuantitativeValue' as const,
            minValue: job.salary_min,
            maxValue: job.salary_max,
            unitText: 'MONTH' as const,
          },
        }
      : undefined

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description.replace(/<[^>]*>/g, '').slice(0, 2000),
    identifier: { '@type': 'PropertyValue' as const, value: job.id },
    datePosted: job.created_at,
    employmentType: job.job_type === 'intern' ? 'INTERN' : 'FULL_TIME',
    jobLocation: {
      '@type': 'Place' as const,
      address: {
        '@type': 'PostalAddress' as const,
        addressLocality: job.location,
        addressRegion: job.location,
        addressCountry: 'GH' as const,
      },
    },
    ...(baseSalary && { baseSalary }),
    hiringOrganization: {
      '@type': 'Organization' as const,
      name: job.profiles?.farm_name || 'AgroTalent Hub',
      sameAs: siteConfig.url,
    },
    directApply: true,
    url: `${siteConfig.url}/jobs/${job.id}`,
  }

  const scriptContent = JSON.stringify(schema).replace(
    /<\/script/gi,
    '<\\/script'
  )

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  )
}
