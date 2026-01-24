'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
]

export default function PostJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'farm_hand',
    location: '',
    address: '',
    salary_min: '',
    salary_max: '',
    required_qualification: '',
    required_institution_type: 'any',
    required_experience_years: '0',
    required_specialization: '',
    expires_at: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
          required_experience_years: parseInt(formData.required_experience_years),
          expires_at: formData.expires_at || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post job')
      }

      router.push('/dashboard/farm')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <Link href="/dashboard/farm" className="text-primary hover:text-primary/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Post New Job</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a new job posting to attract qualified candidates</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-background-dark rounded-xl p-8 border border-gray-200 dark:border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                placeholder="e.g., Farm Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                placeholder="Describe the job responsibilities, requirements, and what you're looking for..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="job_type"
                  required
                  value={formData.job_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="farm_hand">Farm Hand</option>
                  <option value="farm_manager">Farm Manager</option>
                  <option value="intern">Intern</option>
                  <option value="nss">NSS</option>
                  <option value="data_collector">Data Collector</option>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="">Select region</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="any">Any</option>
                  <option value="university">University</option>
                  <option value="training_college">Training College</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="required_experience_years"
                  value={formData.required_experience_years}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialization
                </label>
                <select
                  name="required_specialization"
                  value={formData.required_specialization}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                >
                  <option value="">Any</option>
                  <option value="crop">Crop Production</option>
                  <option value="livestock">Livestock</option>
                  <option value="agribusiness">Agribusiness</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address (Optional)
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                placeholder="Detailed address (optional)"
              />
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard/farm"
                className="px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
