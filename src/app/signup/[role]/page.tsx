'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createSupabaseClient } from '@/lib/supabase/client'

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic'

const supabase = createSupabaseClient()

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
]

const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Plantain', 'Cocoa', 'Oil Palm',
  'Vegetables', 'Fruits', 'Legumes', 'Other Crops'
]

const LIVESTOCK_TYPES = [
  'Cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs', 'Fish (Aquaculture)', 'Other Livestock'
]

export default function SignUpRolePage() {
  const router = useRouter()
  const params = useParams()
  const role = params.role as string

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    // Farm-specific
    farm_name: '',
    farm_type: '',
    farm_location: '',
    farm_address: '',
    // Graduate/Student-specific
    institution_name: '',
    institution_type: '',
    qualification: '',
    specialization: '',
    graduation_year: '',
    preferred_region: '',
    nss_status: 'not_applicable',
    // Skilled Worker-specific
    years_of_experience: '',
    experience_description: '',
    crops_experience: [] as string[],
    livestock_experience: [] as string[],
    skills: '',
    previous_employer: '',
    reference_name: '',
    reference_phone: '',
    reference_relationship: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (!['farm', 'graduate', 'student', 'skilled'].includes(role)) {
      router.push('/signup')
    }
  }, [role, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'crops_experience' | 'livestock_experience') => {
    const value = e.target.value
    const currentValues = formData[field]
    
    if (e.target.checked) {
      setFormData({ ...formData, [field]: [...currentValues, value] })
    } else {
      setFormData({ ...formData, [field]: currentValues.filter((v: string) => v !== value) })
    }
  }

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (role === 'farm') {
      if (!formData.farm_name || !formData.farm_location) {
        setError('Please fill in all required fields')
        return false
      }
    } else if (role === 'skilled') {
      if (!formData.years_of_experience || !formData.preferred_region || !formData.experience_description) {
        setError('Please fill in all required fields')
        return false
      }
      if (parseInt(formData.years_of_experience) < 0) {
        setError('Years of experience cannot be negative')
        return false
      }
    } else {
      if (!formData.institution_name || !formData.preferred_region) {
        setError('Please fill in all required fields')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateStep1() || !validateStep2()) {
      setLoading(false)
      return
    }

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        role,
      }

      if (role === 'farm') {
        payload.farm_name = formData.farm_name
        payload.farm_type = formData.farm_type
        payload.farm_location = formData.farm_location
        payload.farm_address = formData.farm_address
      } else if (role === 'skilled') {
        payload.years_of_experience = parseInt(formData.years_of_experience) || 0
        payload.experience_description = formData.experience_description
        payload.crops_experience = formData.crops_experience
        payload.livestock_experience = formData.livestock_experience
        payload.skills = formData.skills
        payload.previous_employer = formData.previous_employer
        payload.reference_name = formData.reference_name
        payload.reference_phone = formData.reference_phone
        payload.reference_relationship = formData.reference_relationship
        payload.preferred_region = formData.preferred_region
      } else {
        payload.institution_name = formData.institution_name
        payload.institution_type = formData.institution_type
        payload.qualification = formData.qualification
        payload.specialization = formData.specialization
        payload.graduation_year = formData.graduation_year ? parseInt(formData.graduation_year) : null
        payload.preferred_region = formData.preferred_region
        // Add optional experience fields for graduates/students
        if (formData.years_of_experience) {
          payload.years_of_experience = parseInt(formData.years_of_experience) || 0
        }
        if (formData.experience_description) {
          payload.experience_description = formData.experience_description
        }
        if (formData.crops_experience.length > 0) {
          payload.crops_experience = formData.crops_experience
        }
        if (formData.livestock_experience.length > 0) {
          payload.livestock_experience = formData.livestock_experience
        }
        if (formData.skills) {
          payload.skills = formData.skills
        }
        if (role === 'student') {
          payload.nss_status = formData.nss_status
        }
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed')
      }

      // If signup was successful, check if email verification is required
      if (data.user) {
        // Check if email verification is required (from backend response)
        if (data.requiresEmailVerification) {
          // Email verification required - redirect to verify email page
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
          return
        }
        
        // If email is auto-confirmed, try to sign in automatically
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })

          if (signInError) {
            // If sign in fails (e.g., email not confirmed), redirect to verify email
            console.log('Auto sign-in failed, redirecting to verify email:', signInError.message)
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
            return
          }

          if (signInData.session) {
            // Successfully signed in, redirect to dashboard
            const dashboardRole = role === 'student' ? 'graduate' : role
            router.push(`/dashboard/${dashboardRole}`)
            router.refresh()
          } else {
            // No session, redirect to verify email
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
          }
        } catch (signInErr: any) {
          // If auto sign-in fails, redirect to verify email
          console.error('Sign in error:', signInErr)
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        }
      } else {
        // No user data, redirect to verify email
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!['farm', 'graduate', 'student', 'skilled'].includes(role)) {
    return null
  }

  const getRoleTitle = () => {
    switch(role) {
      case 'farm': return 'Employer/Farm'
      case 'graduate': return 'Graduate'
      case 'student': return 'Student'
      case 'skilled': return 'Skilled/Experienced Worker'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold text-[#101914] dark:text-white">
            Create {getRoleTitle()} Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 2
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-background-dark p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold mb-4">Account Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="your.email@example.com"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="Confirm your password"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2)
                    setError('')
                  }
                }}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold mb-4">
                {role === 'farm' ? 'Employer/Farm Information' : role === 'skilled' ? 'Your Experience & Skills' : 'Academic Information'}
              </h3>

              {role === 'farm' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employer/Farm Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="farm_name"
                      required
                      value={formData.farm_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employer/Farm Type
                    </label>
                    <select
                      name="farm_type"
                      value={formData.farm_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select employer type</option>
                      <option value="small">Small Scale</option>
                      <option value="medium">Medium Scale</option>
                      <option value="large">Large Scale</option>
                      <option value="agro_processing">Agro-Processing</option>
                      <option value="research">Research</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="farm_location"
                      required
                      value={formData.farm_location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select region</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Farm Address
                    </label>
                    <textarea
                      name="farm_address"
                      value={formData.farm_address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              ) : role === 'skilled' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years of Farming Experience <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="years_of_experience"
                      required
                      min="0"
                      max="50"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Describe Your Experience <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="experience_description"
                      required
                      value={formData.experience_description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="Tell us about your farming experience, what you've learned, and what you're good at..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Crops You Have Experience With
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark">
                      {CROPS.map((crop) => (
                        <label key={crop} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={crop}
                            checked={formData.crops_experience.includes(crop)}
                            onChange={(e) => handleCheckboxChange(e, 'crops_experience')}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{crop}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Livestock You Have Experience With
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark">
                      {LIVESTOCK_TYPES.map((livestock) => (
                        <label key={livestock} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={livestock}
                            checked={formData.livestock_experience.includes(livestock)}
                            onChange={(e) => handleCheckboxChange(e, 'livestock_experience')}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{livestock}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Skills or Equipment You Can Handle
                    </label>
                    <textarea
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., Tractor operation, irrigation systems, pruning, harvesting techniques..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Work Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="preferred_region"
                      required
                      value={formData.preferred_region}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select preferred region</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Previous Employer or Farm (Optional)
                    </label>
                    <input
                      type="text"
                      name="previous_employer"
                      value={formData.previous_employer}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="Name of farm or employer"
                    />
                  </div>

                  <div className="border-t border-gray-300 dark:border-white/20 pt-4 mt-2">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Reference (Optional but Recommended)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Provide someone who can confirm your experience (farm owner, community leader, etc.)
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reference Name
                        </label>
                        <input
                          type="text"
                          name="reference_name"
                          value={formData.reference_name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reference Phone Number
                        </label>
                        <input
                          type="tel"
                          name="reference_phone"
                          value={formData.reference_phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="+233 XX XXX XXXX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relationship to Reference
                        </label>
                        <input
                          type="text"
                          name="reference_relationship"
                          value={formData.reference_relationship}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="e.g., Former employer, farm owner, community leader"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="institution_name"
                      required
                      value={formData.institution_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="University or Training College name"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="e.g., BSc Agriculture, Diploma in Agriculture"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select specialization</option>
                      <option value="crop">Crop Production</option>
                      <option value="livestock">Livestock</option>
                      <option value="agribusiness">Agribusiness</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="preferred_region"
                      required
                      value={formData.preferred_region}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select preferred region</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {role === 'graduate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        name="graduation_year"
                        value={formData.graduation_year}
                        onChange={handleChange}
                        min="2000"
                        max={new Date().getFullYear() + 1}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        NSS Status
                      </label>
                      <select
                        name="nss_status"
                        value={formData.nss_status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      >
                        <option value="not_applicable">Not Applicable</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  )}

                  {/* Optional Experience Section for Graduates/Students */}
                  <div className="border-t border-gray-300 dark:border-white/20 pt-6 mt-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                      Additional Experience (Optional)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Have you worked on farms before? Share your practical experience to strengthen your profile.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Years of Farming Experience
                        </label>
                        <input
                          type="number"
                          name="years_of_experience"
                          min="0"
                          max="50"
                          value={formData.years_of_experience}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="e.g., 2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Describe Your Experience
                        </label>
                        <textarea
                          name="experience_description"
                          value={formData.experience_description}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="Tell us about any farming work you've done (family farm, internships, part-time work, etc.)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Crops You Have Experience With
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark max-h-40 overflow-y-auto">
                          {CROPS.map((crop) => (
                            <label key={crop} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={crop}
                                checked={formData.crops_experience.includes(crop)}
                                onChange={(e) => handleCheckboxChange(e, 'crops_experience')}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{crop}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Livestock You Have Experience With
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark">
                          {LIVESTOCK_TYPES.map((livestock) => (
                            <label key={livestock} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={livestock}
                                checked={formData.livestock_experience.includes(livestock)}
                                onChange={(e) => handleCheckboxChange(e, 'livestock_experience')}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{livestock}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Special Skills or Equipment
                        </label>
                        <textarea
                          name="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                          placeholder="e.g., Tractor operation, irrigation, pruning techniques"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
