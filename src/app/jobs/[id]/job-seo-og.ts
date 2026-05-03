import type { JobSeoRow } from './job-seo-types'

function salaryTextForOg(job: JobSeoRow): string {
  if (job.salary_min != null && job.salary_max != null) {
    return 'GHS ' + String(job.salary_min) + ' - ' + String(job.salary_max)
  }
  if (job.salary_min != null) {
    return 'From GHS ' + String(job.salary_min)
  }
  return ''
}

export function buildJobOgImageUrl(job: JobSeoRow, siteUrl: string): string {
  const raw = job.image_url?.trim() ?? ''
  if (raw) return raw
  const salaryText = salaryTextForOg(job)
  return (
    siteUrl +
    '/api/og/job?' +
    new URLSearchParams({
      title: job.title,
      location: job.location ?? '',
      city: job.city ?? '',
      job_type: job.job_type ?? '',
      salary: salaryText,
      specialization: job.required_specialization ?? '',
      image_url: job.image_url ?? '',
    }).toString()
  )
}
