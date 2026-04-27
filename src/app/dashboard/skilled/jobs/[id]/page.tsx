'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'
import { markBrowseJobsComplete } from '@/lib/mark-browse-jobs'
import type { Job } from '@/types'
import JobBenefits from '@/components/dashboard/JobBenefits'

const supabase = createSupabaseClient()

type PageJob = Job & {
  profiles?: {
    id: string
    farm_name: string
    full_name?: string
    farm_type: string
    farm_location: string
  } | null
}

export default function SkilledJobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<PageJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [existingApp, setExistingApp] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    fetchJob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (cancelled) return
      markBrowseJobsComplete(auth.user?.id ?? null)
      const user = auth.user
      if (!user) {
        setExistingApp(null)
        return
      }
      const { data: appData } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setExistingApp(
          appData ? { id: appData.id as string, status: appData.status as string } : null
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [jobId])

  const fetchJob = async () => {
    try {
      setLoading(true)
      setError('')
      // Use apiClient to fetch job
      const data = await apiClient.getJobs({ id: jobId })
      setJob(data.job || data.jobs?.[0])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch job')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `GHS ${min.toLocaleString()} - ${max.toLocaleString()}/month`
    if (min) return `GHS ${min.toLocaleString()}+/month`
    return `Up to GHS ${max?.toLocaleString()}/month`
  }

  const formatJobType = (type: string) => {
    const types: Record<string, string> = {
      farm_hand: 'Farm Hand',
      farm_manager: 'Farm Manager',
      intern: 'Intern',
      nss: 'NSS',
      data_collector: 'Data Collector'
    }
    return types[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This job does not exist or has been removed.'}</p>
          <Link href="/dashboard/skilled/jobs" className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
            Browse All Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <Link href="/dashboard/skilled/jobs" className="text-accent hover:text-accent/80 mb-6 inline-block">
          ← Back to Jobs
        </Link>

        <div className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {(job.is_platform_job
                  ? 'AgroTalent Hub'
                  : job.profiles?.farm_name ?? job.profiles?.full_name ?? 'Unknown Farm')}{' '}
                • {job.location}
              </p>
            </div>
            <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-bold">
              {formatJobType(job.job_type)}
            </span>
          </div>

          <div className='mb-8'>
            <h2 className='mb-4 text-xl font-bold'>Job Description</h2>
            <div
              className='prose prose-sm max-w-none text-gray-600 prose-headings:text-forest prose-strong:text-gray-800 prose-li:text-gray-600 prose-a:text-brand'
              dangerouslySetInnerHTML={{ __html: job.description ?? '' }}
            />
            {job.responsibilities ? (
              <div>
                <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                  Responsibilities
                </h3>
                <div
                  className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                  dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                />
              </div>
            ) : null}
            {job.requirements ? (
              <div>
                <h3 className='mb-3 mt-5 text-sm font-bold text-gray-900'>
                  Requirements
                </h3>
                <div
                  className='prose prose-sm max-w-none text-gray-600 prose-li:text-gray-600'
                  dangerouslySetInnerHTML={{ __html: job.requirements }}
                />
              </div>
            ) : null}
            <JobBenefits job={job} />
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 pt-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.location}</p>
                {job.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{job.address}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Salary</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatSalary(job.salary_min, job.salary_max)}</p>
              </div>
              {job.required_qualification && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Required Qualification</p>
                  <p className="font-medium text-gray-900 dark:text-white">{job.required_qualification}</p>
                </div>
              )}
              {job.required_experience_years !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Experience Required</p>
                  <p className="font-medium text-gray-900 dark:text-white">{job.required_experience_years} year{job.required_experience_years !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>

          <div className='mt-6'>
            {existingApp ? (
              <div className='rounded-2xl border border-green-100 bg-green-50 p-5'>
                <p className='text-sm font-semibold text-green-700'>Already Applied</p>
                <p className='mt-1 text-xs text-green-600'>
                  Status: {existingApp.status}
                </p>
              </div>
            ) : (
              <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                <h3 className='mb-3 font-bold text-gray-900'>Apply for this Position</h3>
                <p className='mb-4 text-sm text-gray-500'>
                  Complete your application with your CV and eligibility details.
                </p>
                <Link
                  href={'/jobs/' + jobId + '/apply'}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-bold text-white transition-colors hover:bg-forest'
                >
                  Start Application
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
