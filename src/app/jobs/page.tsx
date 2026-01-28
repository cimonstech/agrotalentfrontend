'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Job {
  id: string
  title: string
  description: string
  job_type: string
  location: string
  address?: string
  salary_min?: number
  salary_max?: number
  required_qualification?: string
  required_specialization?: string
  created_at: string
  profiles?: {
    farm_name: string
    farm_type: string
  }
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

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'all'>('active')

  useEffect(() => {
    fetchJobs()
  }, [selectedLocation, selectedJobType, selectedSpecialization, selectedStatus])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedLocation) params.append('location', selectedLocation)
      if (selectedJobType) params.append('job_type', selectedJobType)
      if (selectedSpecialization) params.append('specialization', selectedSpecialization)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/jobs?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      setJobs(data.jobs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.profiles?.farm_name?.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    )
  })

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `GHS ${min.toLocaleString()} - ${max.toLocaleString()}/month`
    if (min) return `GHS ${min.toLocaleString()}+/month`
    return `Up to GHS ${max?.toLocaleString()}/month`
  }

  const formatJobType = (type: string) => {
    return JOB_TYPES.find(t => t.value === type)?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      farm_hand: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      farm_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      intern: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      nss: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      data_collector: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/pict_large.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/85 dark:from-background-dark/95 dark:via-primary/85 dark:to-accent/90"></div>
        </div>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Find Your Perfect Agricultural Opportunity
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Browse verified job opportunities from farms across Ghana. Location-based matching ensures you find opportunities in your preferred region.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search jobs, farms, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="">All Regions</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Job Type Filter */}
            <div>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {JOB_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Specialization Filter */}
            <div>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="">All Specializations</option>
                <option value="crop">Crop Production</option>
                <option value="livestock">Livestock</option>
                <option value="agribusiness">Agribusiness</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'active' | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="active">Active Only</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedLocation || selectedJobType || selectedSpecialization || selectedStatus !== 'active') && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {selectedLocation && (
                <button
                  onClick={() => setSelectedLocation('')}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {selectedLocation} <i className="fas fa-times ml-1"></i>
                </button>
              )}
              {selectedJobType && (
                <button
                  onClick={() => setSelectedJobType('')}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {formatJobType(selectedJobType)} <i className="fas fa-times ml-1"></i>
                </button>
              )}
              {selectedSpecialization && (
                <button
                  onClick={() => setSelectedSpecialization('')}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {selectedSpecialization} <i className="fas fa-times ml-1"></i>
                </button>
              )}
              {selectedStatus !== 'active' && (
                <button
                  onClick={() => setSelectedStatus('active')}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  All Statuses <i className="fas fa-times ml-1"></i>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedLocation('')
                  setSelectedJobType('')
                  setSelectedSpecialization('')
                  setSelectedStatus('active')
                }}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-primary text-sm"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Jobs List */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-10 py-12">
        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <i className="fas fa-briefcase text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No jobs found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || selectedLocation || selectedJobType || selectedSpecialization
                ? 'Try adjusting your filters or search query'
                : 'No jobs are currently available. Check back soon!'}
            </p>
            {(selectedLocation || selectedJobType || selectedSpecialization) && (
              <button
                onClick={() => {
                  setSelectedLocation('')
                  setSelectedJobType('')
                  setSelectedSpecialization('')
                  setSearchQuery('')
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-gray-900 dark:text-white">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {job.profiles?.farm_name || 'Farm'} • {job.location}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getJobTypeColor(job.job_type)}`}>
                          {formatJobType(job.job_type)}
                        </span>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-map-marker-alt text-primary"></i>
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-money-bill-wave text-primary"></i>
                          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                        {job.required_qualification && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-graduation-cap text-primary"></i>
                            <span>{job.required_qualification}</span>
                          </div>
                        )}
                        {job.required_specialization && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-tag text-primary"></i>
                            <span className="capitalize">{job.required_specialization}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <i className="fas fa-clock"></i>
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/jobs/${job.id}?apply=true`}
                        className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors text-center"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA Section */}
      {!loading && filteredJobs.length > 0 && (
        <section className="bg-primary/5 py-12 mt-12">
          <div className="max-w-[1200px] mx-auto px-4 md:px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Don't see the right opportunity?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a profile and get matched with jobs that fit your skills and location preferences.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              Create Your Profile
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
