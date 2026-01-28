'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

export default function SkilledJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    type: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      // Use apiClient to fetch jobs
      const data = await apiClient.getJobs({
        location: filters.region || undefined,
        job_type: filters.type || undefined
      })
      let jobsList = data.jobs || []
      
      // Client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        jobsList = jobsList.filter((job: any) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.profiles?.farm_name?.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower)
        )
      }
      
      setJobs(jobsList)
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/skilled" className="text-accent hover:text-accent/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">Find opportunities that match your skills and experience</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by title, farm, location..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Regions</option>
            {['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo', 'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-briefcase text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No jobs found</p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              View Public Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job: any, idx: number) => (
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
                  <span className="shrink-0 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold">
                    {job.job_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>

                <p className="mt-4 text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-line">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  {job.salary_min && (
                    <span><i className="fas fa-money-bill-wave mr-1"></i>GHS {job.salary_min?.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}/month</span>
                  )}
                  <span><i className="fas fa-calendar mr-1"></i>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/dashboard/skilled/jobs/${job.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/skilled/jobs/${job.id}?apply=true`}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
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
