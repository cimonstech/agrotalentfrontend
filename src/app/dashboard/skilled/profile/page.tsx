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

const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Cocoa', 'Plantain', 'Tomatoes', 
  'Pepper', 'Onions', 'Cabbage', 'Lettuce', 'Beans', 'Groundnuts', 
  'Soybean', 'Oil Palm', 'Mango', 'Pineapple', 'Banana', 'Citrus', 'Vegetables'
]

const LIVESTOCK_TYPES = [
  'Poultry', 'Cattle', 'Goats', 'Sheep', 'Pigs', 'Fish', 'Rabbits', 'Guinea Fowl'
]

export default function SkilledProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Multi-select states
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])
  const [selectedLivestock, setSelectedLivestock] = useState<string[]>([])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await apiClient.getProfile()
      setProfile(data.profile)
      
      // Initialize multi-select from profile
      if (data.profile?.crops_experience) {
        setSelectedCrops(data.profile.crops_experience)
      }
      if (data.profile?.livestock_experience) {
        setSelectedLivestock(data.profile.livestock_experience)
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      setError(error.message || 'Failed to load profile. Please try again.')
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

  const handleCheckboxChange = (item: string, type: 'crops' | 'livestock') => {
    if (type === 'crops') {
      setSelectedCrops(prev =>
        prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
      )
    } else {
      setSelectedLivestock(prev =>
        prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
      )
    }
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
        years_of_experience: profile.years_of_experience ? parseInt(profile.years_of_experience) : null,
        experience_description: profile.experience_description,
        crops_experience: selectedCrops,
        livestock_experience: selectedLivestock,
        skills: profile.skills,
        previous_employer: profile.previous_employer,
        reference_name: profile.reference_name,
        reference_phone: profile.reference_phone,
        reference_relationship: profile.reference_relationship,
        preferred_region: profile.preferred_region
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(type)
    setError('')

    try {
      const data = await apiClient.uploadDocument(file, type)
      
      setProfile({ ...profile, [`${type}_url`]: data.url })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(null)
    }
  }

  const calculateProfileStrength = () => {
    if (!profile) return 0
    const checks = [
      profile?.full_name,
      profile?.phone,
      profile?.years_of_experience,
      profile?.experience_description,
      selectedCrops.length > 0,
      selectedLivestock.length > 0,
      profile?.skills,
      profile?.preferred_region,
      profile?.reference_name && profile?.reference_phone
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const profileStrength = calculateProfileStrength()

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <Link href="/dashboard/skilled" className="text-accent hover:text-accent/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your experience and skills to get better job matches</p>
        </div>

        {/* Profile Strength Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 dark:text-white">Profile Strength: {profileStrength}%</h3>
            <span className="text-sm text-accent font-medium">
              {profileStrength < 40 ? 'Beginner' : profileStrength < 70 ? 'Good' : profileStrength < 90 ? 'Great' : 'Excellent'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-accent h-3 rounded-full transition-all duration-500"
              style={{ width: `${profileStrength}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Complete your profile to increase visibility to employers
          </p>
        </motion.div>

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

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-user text-accent"></i>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={profile?.full_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={profile?.phone || ''}
                  onChange={handleChange}
                  placeholder="+233..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-briefcase text-accent"></i>
              Work Experience
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    name="years_of_experience"
                    min="0"
                    max="50"
                    required
                    value={profile?.years_of_experience || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Previous Employer (Optional)
                  </label>
                  <input
                    type="text"
                    name="previous_employer"
                    value={profile?.previous_employer || ''}
                    onChange={handleChange}
                    placeholder="Farm or company name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Description *
                </label>
                <textarea
                  name="experience_description"
                  required
                  value={profile?.experience_description || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your practical farming experience, responsibilities, and achievements..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Crops Experience */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="w-5 h-5" />
              Crops Experience
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select all crops you have experience working with
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CROPS.map(crop => (
                <label key={crop} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCrops.includes(crop)}
                    onChange={() => handleCheckboxChange(crop, 'crops')}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{crop}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Livestock Experience */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-paw text-accent"></i>
              Livestock Experience
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select all livestock types you have experience with
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LIVESTOCK_TYPES.map(livestock => (
                <label key={livestock} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLivestock.includes(livestock)}
                    onChange={() => handleCheckboxChange(livestock, 'livestock')}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{livestock}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-tools text-accent"></i>
              Skills & Abilities
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Skills *
              </label>
              <textarea
                name="skills"
                required
                value={profile?.skills || ''}
                onChange={handleChange}
                rows={3}
                placeholder="e.g., Tractor operation, Irrigation systems, Crop management, Animal husbandry, Equipment maintenance..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* References */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-user-friends text-accent"></i>
              References (Optional but Recommended)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Name
                  </label>
                  <input
                    type="text"
                    name="reference_name"
                    value={profile?.reference_name || ''}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Phone
                  </label>
                  <input
                    type="tel"
                    name="reference_phone"
                    value={profile?.reference_phone || ''}
                    onChange={handleChange}
                    placeholder="+233..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship with Reference
                </label>
                <input
                  type="text"
                  name="reference_relationship"
                  value={profile?.reference_relationship || ''}
                  onChange={handleChange}
                  placeholder="e.g., Former Supervisor, Farm Manager, Colleague"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-accent"></i>
              Work Preferences
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Region
              </label>
              <select
                name="preferred_region"
                value={profile?.preferred_region || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
              >
                <option value="">Select a region</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-file-upload text-accent"></i>
              Documents (Optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Document / Certification
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'certificate')}
                  disabled={uploading === 'certificate'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                />
                {uploading === 'certificate' && (
                  <p className="text-sm text-accent mt-1">
                    <i className="fas fa-spinner fa-spin mr-1"></i> Uploading...
                  </p>
                )}
                {profile?.certificate_url && (
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-check-circle mr-1"></i> Document uploaded
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-accent text-white rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
            <Link
              href="/dashboard/skilled"
              className="px-8 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
