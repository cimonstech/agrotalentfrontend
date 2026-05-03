export type JobSeoRow = {
  id: string
  title: string
  description: string | null
  location: string
  city?: string | null
  job_type: string
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  required_qualification?: string | null
  required_specialization?: string | null
  image_url?: string | null
  created_at: string
  expires_at?: string | null
  benefits?: unknown
  is_platform_job?: boolean | null
  profiles?: { farm_name?: string | null } | { farm_name?: string | null }[] | null
}
