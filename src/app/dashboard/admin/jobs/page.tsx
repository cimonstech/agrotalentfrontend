'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

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

export default function AdminJobsPage() {
  const router = useRouter()
  const [farmSearchQuery, setFarmSearchQuery] = useState('')
  const [unknownFarmId, setUnknownFarmId] = useState<string | null>(null)
  const [resolvingUnknownFarm, setResolvingUnknownFarm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    farm_id: '',
    title: '',
    description: '',
    job_type: 'farm_hand',
    location: '',
    address: '',
    salary_min: '',
    salary_max: '',
    required_qualification: '',
    required_institution_type: 'any',
    required_experience_years: 0,
    required_specialization: '',
    expires_at: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('')

  useEffect(() => {
    fetchJobs()
    fetchFarms()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      // Use admin endpoint to get all jobs from all employers
      const data = await apiClient.getAdminJobs()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFarms = async () => {
    try {
      const data = await apiClient.getAdminUsers({ role: 'farm', limit: 500 })
      setFarms(data.users || [])
    } catch (error) {
      console.error('Failed to fetch farms:', error)
    }
  }

  const ensureUnknownFarm = async () => {
    if (unknownFarmId) return unknownFarmId
    setResolvingUnknownFarm(true)
    try {
      const { profile } = await apiClient.ensureUnknownFarm()
      setUnknownFarmId(profile.id)
      setFarms(prev => {
        if (prev.some(f => f.id === profile.id)) return prev
        return [{ id: profile.id, farm_name: profile.farm_name || 'Farm (unknown)', email: '', farm_location: '' }, ...prev]
      })
      return profile.id
    } catch (err) {
      console.error('Failed to ensure unknown farm:', err)
      throw err
    } finally {
      setResolvingUnknownFarm(false)
    }
  }

  const filteredFarms = farmSearchQuery.trim()
    ? farms.filter(
        f =>
          (f.farm_name || '').toLowerCase().includes(farmSearchQuery.toLowerCase()) ||
          (f.email || '').toLowerCase().includes(farmSearchQuery.toLowerCase()) ||
          (f.farm_location || '').toLowerCase().includes(farmSearchQuery.toLowerCase())
      )
    : farms

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEdit = (job: any) => {
    setEditingJob(job)
    setFormData({
      farm_id: job.farm_id || '',
      title: job.title || '',
      description: job.description || '',
      job_type: job.job_type || 'farm_hand',
      location: job.location || '',
      address: job.address || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      required_qualification: job.required_qualification || '',
      required_institution_type: job.required_institution_type || 'any',
      required_experience_years: job.required_experience_years || 0,
      required_specialization: job.required_specialization || '',
      expires_at: job.expires_at ? new Date(job.expires_at).toISOString().slice(0, 16) : '',
      status: job.status || 'active'
    })
    setShowCreateModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Prepare data for API - convert empty strings to null/undefined
      const jobData: any = {
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        location: formData.location,
        required_institution_type: formData.required_institution_type,
        required_experience_years: parseInt(formData.required_experience_years.toString()) || 0
      }

      // Admin must select a farm
      if (!formData.farm_id) {
        setError('Please select an employer/farm for this job')
        setSubmitting(false)
        return
      }
      jobData.farm_id = formData.farm_id

      // Only include optional fields if they have values
      if (formData.address) jobData.address = formData.address
      if (formData.salary_min) jobData.salary_min = parseFloat(formData.salary_min.toString())
      if (formData.salary_max) jobData.salary_max = parseFloat(formData.salary_max.toString())
      if (formData.required_qualification) jobData.required_qualification = formData.required_qualification
      if (formData.required_specialization) jobData.required_specialization = formData.required_specialization
      if (formData.expires_at) jobData.expires_at = formData.expires_at
      if (editingJob) {
        jobData.status = formData.status
      }

      if (editingJob) {
        // Update existing job
        await apiClient.updateJob(editingJob.id, jobData)
        alert('Job updated successfully!')
      } else {
        // Create new job
        await apiClient.createJob(jobData)
        alert('Job posted successfully!')
      }
      
      setShowCreateModal(false)
      setEditingJob(null)
      setFormData({
        farm_id: '',
        title: '',
        description: '',
        job_type: 'farm_hand',
        location: '',
        address: '',
        salary_min: '',
        salary_max: '',
        required_qualification: '',
        required_institution_type: 'any',
        required_experience_years: 0,
        required_specialization: '',
        expires_at: '',
        status: 'active'
      })
      fetchJobs()
    } catch (err: any) {
      console.error('Error posting/updating job:', err)
      setError(err.message || 'Failed to save job. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (job: any) => {
    if (!confirm(`Delete job "${job.title}"? This will also remove all applications for this job.`)) return
    try {
      setDeletingId(job.id)
      await apiClient.deleteJob(job.id)
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } catch (err: any) {
      console.error('Delete job error:', err)
      alert(err.message || 'Failed to delete job')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== 'DELETE ALL') return
    try {
      setDeletingAll(true)
      await apiClient.deleteAllJobs()
      setJobs([])
      setShowDeleteAllModal(false)
      setDeleteAllConfirm('')
    } catch (err: any) {
      console.error('Delete all jobs error:', err)
      alert(err.message || 'Failed to delete all jobs')
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Job Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Post and manage job listings</p>
          </div>
          <div className="flex gap-3">
            {jobs.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                Delete all jobs
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Post New Job
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No jobs found. Post your first job!
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{job.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {job.profiles?.farm_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.profiles?.farm_type || ''}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {job.job_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">{job.location}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            job.status === 'filled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            job.status === 'closed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            job.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            job.status === 'paused' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(job)}
                              className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              Edit
                            </button>
                            <a
                              href={`/jobs?id=${job.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDelete(job)}
                              disabled={deletingId === job.id}
                              className="px-3 py-1 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              {deletingId === job.id ? <i className="fas fa-spinner fa-spin"></i> : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl my-8">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl shadow-xl w-full p-8 max-h-[90vh] overflow-y-auto"
              >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingJob ? 'Edit Job' : 'Post New Job'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingJob(null)
                    setFarmSearchQuery('')
                    setFormData({
                      farm_id: '',
                      title: '',
                      description: '',
                      job_type: 'farm_hand',
                      location: '',
                      address: '',
                      salary_min: '',
                      salary_max: '',
                      required_qualification: '',
                      required_institution_type: 'any',
                      required_experience_years: 0,
                      required_specialization: '',
                      expires_at: '',
                      status: 'active'
                    })
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employer/Farm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search by farm name, email, or location..."
                      value={farmSearchQuery}
                      onChange={(e) => setFarmSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 mb-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white placeholder-gray-500"
                    />
                    <select
                      name="farm_id"
                      required
                      value={formData.farm_id}
                      onChange={async (e) => {
                        const value = e.target.value
                        if (value === '__unknown__') {
                          try {
                            const id = await ensureUnknownFarm()
                            setFormData(prev => ({ ...prev, farm_id: id }))
                          } catch (err: any) {
                            setError(err?.message || 'Could not add Farm (unknown). Please try again.')
                          }
                          return
                        }
                        setFormData(prev => ({ ...prev, farm_id: value }))
                      }}
                      disabled={resolvingUnknownFarm}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select Employer/Farm</option>
                      <option value={unknownFarmId || '__unknown__'}>
                        Farm (unknown)
                      </option>
                      {filteredFarms.map(farm => (
                        <option key={farm.id} value={farm.id}>
                          {farm.farm_name || farm.email} {farm.farm_location ? `(${farm.farm_location})` : ''}
                        </option>
                      ))}
                    </select>
                    {farms.length === 0 && !unknownFarmId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        No farms found. Use &quot;Farm (unknown)&quot; above or add farms first.
                      </p>
                    )}
                    {farmSearchQuery && filteredFarms.length === 0 && farms.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        No farms match your search. Try a different term or choose &quot;Farm (unknown)&quot;.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., Farm Manager"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="Describe the job role, responsibilities, and requirements..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="job_type"
                      required
                      value={formData.job_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      {JOB_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location (Region) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select Region</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="Specific address or area"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salary Min (GHS)
                    </label>
                    <input
                      type="number"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., 1200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salary Max (GHS)
                    </label>
                    <input
                      type="number"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., 2000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Required Qualification
                    </label>
                    <input
                      type="text"
                      name="required_qualification"
                      value={formData.required_qualification}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., BSc, Diploma"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Institution Type
                    </label>
                    <select
                      name="required_institution_type"
                      value={formData.required_institution_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="any">Any</option>
                      <option value="university">University</option>
                      <option value="training_college">Training College</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experience Years
                    </label>
                    <input
                      type="number"
                      name="required_experience_years"
                      value={formData.required_experience_years}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="required_specialization"
                      value={formData.required_specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., Crop Farming, Livestock"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="expires_at"
                      value={formData.expires_at}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (editingJob ? 'Updating...' : 'Posting...') : (editingJob ? 'Update Job' : 'Post Job')}
                  </button>
                </div>
              </form>
              </motion.div>
            </div>
          </div>
        )}

        {/* Delete all jobs confirmation modal */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-background-dark rounded-xl shadow-xl w-full max-w-md p-6 border border-red-200 dark:border-red-800"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete all jobs</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                This will permanently delete every job and all associated applications. This cannot be undone.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                Type <strong className="text-red-600 dark:text-red-400">DELETE ALL</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value)}
                placeholder="DELETE ALL"
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-background-dark text-gray-900 dark:text-white mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(false)
                    setDeleteAllConfirm('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleteAllConfirm !== 'DELETE ALL' || deletingAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingAll ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                  Delete all jobs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
