'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

interface Job {
  id: string
  title: string
  description: string
  job_type: string
  location: string
  address?: string | null
  salary_min?: number | null
  salary_max?: number | null
  required_qualification?: string | null
  required_specialization?: string | null
  created_at: string
  profiles?: {
    farm_name?: string | null
    farm_type?: string | null
  } | null
}

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
]

const JOB_TYPES = [
  { value: 'farm_hand', label: 'Farm Hand' },
  { value: 'farm_manager', label: 'Farm Manager' },
  { value: 'intern', label: 'Intern' },
  { value: 'nss', label: 'NSS' },
  { value: 'data_collector', label: 'Data Collector' }
]

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, selectedJobType, selectedSpecialization])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getJobs({
        location: selectedLocation || undefined,
        job_type: selectedJobType || undefined,
        specialization: selectedSpecialization || undefined
      })
      setJobs(data.jobs || [])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs
    const q = searchQuery.toLowerCase()
    return jobs.filter(job =>
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.profiles?.farm_name?.toLowerCase?.().includes(q) ||
      job.location?.toLowerCase().includes(q)
    )
  }, [jobs, searchQuery])

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `GHS ${min.toLocaleString()} - ${max.toLocaleString()}/month`
    if (min) return `GHS ${min.toLocaleString()}+/month`
    return `Up to GHS ${max?.toLocaleString()}/month`
  }

  const formatJobType = (type: string) => {
    return JOB_TYPES.find(t => t.value === type)?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">Explore job opportunities without leaving your dashboard</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, farm, location..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={selectedJobType}
            onChange={(e) => setSelectedJobType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Job Types</option>
            {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <input
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            placeholder="Specialization (optional)"
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-briefcase text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No jobs found for the current filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {job.profiles?.farm_name || 'Farm'} • {job.location}
                    </p>
                  </div>
                  <span className="shrink-0 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                    {formatJobType(job.job_type)}
                  </span>
                </div>

                <p className="mt-4 text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-line">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span><i className="fas fa-money-bill-wave mr-1"></i>{formatSalary(job.salary_min, job.salary_max)}</span>
                  <span><i className="fas fa-calendar mr-1"></i>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/dashboard/student/jobs/${job.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/student/jobs/${job.id}?apply=true`}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    Apply
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

