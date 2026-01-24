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

export default function CreateUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'graduate',
    // Farm-specific
    farm_name: '',
    farm_type: '',
    farm_location: '',
    // Graduate/Student-specific
    institution_name: '',
    institution_type: '',
    qualification: '',
    specialization: '',
    preferred_region: '',
    is_verified: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/admin/users')
      }, 2000)
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
          <Link href="/dashboard/admin/users" className="text-primary hover:text-primary/80 mb-4 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New User</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a new user account (Super Admin)</p>
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

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
              User created successfully! Redirecting...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="farm">Farm</option>
                <option value="graduate">Graduate</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_verified"
                checked={formData.is_verified}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Verified (skip verification process)
              </label>
            </div>
          </div>

          {/* Role-specific fields */}
          {formData.role === 'farm' && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Farm Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="farm_name"
                    required={formData.role === 'farm'}
                    value={formData.farm_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm Type
                  </label>
                  <select
                    name="farm_type"
                    value={formData.farm_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="small">Small Scale</option>
                    <option value="medium">Medium Scale</option>
                    <option value="large">Large Scale</option>
                    <option value="agro_processing">Agro-Processing</option>
                    <option value="research">Research</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    name="farm_location"
                    value={formData.farm_location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {(formData.role === 'graduate' || formData.role === 'student') && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="institution_name"
                    required={formData.role === 'graduate' || formData.role === 'student'}
                    value={formData.institution_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Institution Type
                  </label>
                  <select
                    name="institution_type"
                    value={formData.institution_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="university">University</option>
                    <option value="training_college">Training College</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Region
                  </label>
                  <select
                    name="preferred_region"
                    value={formData.preferred_region}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <Link
              href="/dashboard/admin/users"
              className="px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
