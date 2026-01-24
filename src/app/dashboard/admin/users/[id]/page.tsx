'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'applications' | 'jobs' | 'placements'>('overview')

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminUser(userId)
      setUserData(data)
    } catch (error: any) {
      console.error('Failed to fetch user details:', error)
      alert(error.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (verified: boolean) => {
    try {
      await apiClient.verifyUser(userId, verified)
      fetchUserDetails() // Refresh
      alert(verified ? 'User verified successfully' : 'Verification revoked')
    } catch (error: any) {
      alert(error.message || 'Failed to update verification status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!userData?.profile) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">User not found</p>
          <Link href="/dashboard/admin/users" className="text-primary hover:underline">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  const profile = userData.profile
  const isFarm = profile.role === 'farm'
  const isGraduate = profile.role === 'graduate' || profile.role === 'student'

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/dashboard/admin/users"
            className="text-primary hover:underline mb-4 inline-block"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Users
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.full_name || 'No Name'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            </div>
            <div className="flex gap-3">
              {!profile.is_verified ? (
                <button
                  onClick={() => handleVerify(true)}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <i className="fas fa-check mr-2"></i>
                  Approve User
                </button>
              ) : (
                <button
                  onClick={() => handleVerify(false)}
                  className="px-6 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Revoke Verification
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-3 mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            profile.is_verified 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {profile.is_verified ? '✓ Verified' : '⏳ Pending Approval'}
          </span>
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary capitalize">
            {profile.role}
          </span>
          {profile.verified_at && (
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
              Verified: {new Date(profile.verified_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-white/10 mb-6">
          <nav className="flex gap-6">
            {['overview', 'documents', ...(isGraduate ? ['applications'] : []), ...(isFarm ? ['jobs'] : []), 'placements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-1 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{profile.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-white font-medium">{profile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Account Created</label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(profile.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role-Specific Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {isFarm ? 'Farm Details' : 'Academic Details'}
                </h3>
                <div className="space-y-3">
                  {isFarm ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Farm Name</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.farm_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Farm Type</label>
                        <p className="text-gray-900 dark:text-white font-medium capitalize">
                          {profile.farm_type?.replace('_', ' ') || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Location</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.farm_location || profile.location || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.address || 'Not provided'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Institution</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.institution_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Institution Type</label>
                        <p className="text-gray-900 dark:text-white font-medium capitalize">
                          {profile.institution_type?.replace('_', ' ') || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Qualification</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.qualification || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Specialization</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.specialization || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Preferred Region</label>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.preferred_region || 'Not provided'}</p>
                      </div>
                      {profile.role === 'student' && (
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">NSS Status</label>
                          <p className="text-gray-900 dark:text-white font-medium capitalize">
                            {profile.nss_status?.replace('_', ' ') || 'Not applicable'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Uploaded Documents</h3>
              {userData.documents && userData.documents.length > 0 ? (
                <div className="space-y-3">
                  {userData.documents.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {doc.document_type?.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doc.file_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <i className="fas fa-download mr-2"></i>
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No documents uploaded</p>
              )}
            </div>
          )}

          {activeTab === 'applications' && isGraduate && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Applications</h3>
              {userData.applications && userData.applications.length > 0 ? (
                <div className="space-y-3">
                  {userData.applications.map((app: any) => (
                    <div key={app.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{app.jobs?.title || 'Unknown Job'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Location: {app.jobs?.location || 'N/A'} | 
                            Match Score: {app.match_score || 0}%
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Applied: {new Date(app.created_at).toLocaleString()} | 
                            Status: <span className="capitalize">{app.status}</span>
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
              )}
            </div>
          )}

          {activeTab === 'jobs' && isFarm && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Posted Jobs</h3>
              {userData.jobs && userData.jobs.length > 0 ? (
                <div className="space-y-3">
                  {userData.jobs.map((job: any) => (
                    <div key={job.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.location} | {job.job_type?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Posted: {new Date(job.created_at).toLocaleString()} | 
                            Status: <span className="capitalize">{job.status}</span>
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No jobs posted yet</p>
              )}
            </div>
          )}

          {activeTab === 'placements' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Placements</h3>
              {userData.placements && userData.placements.length > 0 ? (
                <div className="space-y-3">
                  {userData.placements.map((placement: any) => (
                    <div key={placement.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {isFarm ? placement.graduate?.full_name : placement.farm?.farm_name} - {placement.jobs?.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Status: <span className="capitalize">{placement.status}</span> | 
                            {placement.start_date && `Start: ${new Date(placement.start_date).toLocaleDateString()}`}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Created: {new Date(placement.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          placement.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          placement.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {placement.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No placements yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
