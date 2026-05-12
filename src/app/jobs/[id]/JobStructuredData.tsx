import { buildJobOgImageUrl } from './job-seo-og'
import type { JobSeoRow } from './job-seo-types'

const jobTypeMap: Record<string, string> = {
  farm_hand: 'FULL_TIME',
  farm_manager: 'FULL_TIME',
  intern: 'INTERN',
  nss: 'TEMPORARY',
  data_collector: 'CONTRACTOR',
}

function profileRow(profiles: JobSeoRow['profiles']) {
  if (!profiles) return undefined
  return Array.isArray(profiles) ? profiles[0] : profiles
}

function profileFarmName(
  profiles: JobSeoRow['profiles']
): string | undefined {
  return profileRow(profiles)?.farm_name?.trim() || undefined
}

function profileFarmAddress(
  profiles: JobSeoRow['profiles']
): string | undefined {
  return profileRow(profiles)?.farm_address?.trim() || undefined
}

export function JobStructuredData({ job }: { job: JobSeoRow }) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrotalenthub.com'
  const farmName = profileFarmName(job.profiles)
  const streetAddress =
    job.address?.trim() || profileFarmAddress(job.profiles) || undefined
  const postalCode = job.postal_code?.trim() || undefined

  const plainDescription = (job.description ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const benefitsRecord =
    job.benefits && typeof job.benefits === 'object'
      ? (job.benefits as Record<string, unknown>)
      : null
  const jobBenefitsStr = benefitsRecord
    ? Object.entries(benefitsRecord)
        .filter(([, v]) => v === true)
        .map(([k]) => k.replace(/_/g, ' '))
        .join(', ')
    : undefined

  const ogImageUrl = buildJobOgImageUrl(job, siteUrl)

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: plainDescription,
    datePosted: job.created_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: jobTypeMap[job.job_type ?? ''] ?? 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.is_platform_job ? 'AgroTalent Hub' : farmName ?? 'AgroTalent Hub',
      sameAs: 'https://agrotalenthub.com',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(streetAddress ? { streetAddress } : {}),
        ...(postalCode ? { postalCode } : {}),
        addressLocality: job.city?.trim() || job.location,
        addressRegion: job.location,
        addressCountry: 'GH',
      },
    },
    ...(job.salary_min != null
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salary_currency ?? 'GHS',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salary_min,
              maxValue: job.salary_max ?? job.salary_min,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    ...(job.required_qualification
      ? { qualifications: job.required_qualification }
      : {}),
    ...(job.required_specialization
      ? { skills: job.required_specialization }
      : {}),
    url: siteUrl + '/jobs/' + job.id,
    image: ogImageUrl,
    ...(jobBenefitsStr ? { jobBenefits: jobBenefitsStr } : {}),
  }

  const scriptContent = JSON.stringify(jobPostingSchema).replace(
    /<\/script/gi,
    '<\\/script'
  )

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  )
}
