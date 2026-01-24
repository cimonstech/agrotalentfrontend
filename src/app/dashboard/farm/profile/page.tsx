'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
]

export default function FarmProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await apiClient.getProfile()
      setProfile(data.profile)
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      setError(error.message || 'Failed to load profile. Please try again.')
      // If unauthorized, redirect to sign in
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        router.push('/signin')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const data = await apiClient.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        farm_name: profile.farm_name,
        farm_type: profile.farm_type,
        farm_location: profile.farm_location,
        farm_address: profile.farm_address
      })

      setProfile(data.profile)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <Link href="/dashboard/farm" className="text-primary hover:text-primary/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Employer/Farm Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your employer/farm information</p>
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
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={profile?.full_name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={profile?.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employer/Farm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="farm_name"
                required
                value={profile?.farm_name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employer/Farm Type
                </label>
                <select
                  name="farm_type"
                  value={profile?.farm_type || ''}
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
                  value={profile?.farm_location || ''}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employer/Farm Address
              </label>
              <textarea
                name="farm_address"
                rows={3}
                value={profile?.farm_address || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
              <Link
                href="/dashboard/farm"
                className="px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
