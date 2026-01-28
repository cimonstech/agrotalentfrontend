'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function FarmPlacementsPage() {
  const router = useRouter()
  const [placements, setPlacements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlacements()
  }, [])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      
      // Check authentication
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      // Fetch placements for this farm
      const data = await apiClient.getPlacements({ limit: 200 })
      setPlacements(data.placements || [])
    } catch (error) {
      console.error('Failed to fetch placements:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Placements</h1>
          <p className="text-gray-600 dark:text-gray-400">View all your successful placements</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading placements...</p>
          </div>
        ) : placements.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-handshake text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No placements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {placements.map((placement) => (
              <div key={placement.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {placement.graduate?.full_name || 'Graduate'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {placement.jobs?.title} • {placement.jobs?.location}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Start: {placement.start_date ? new Date(placement.start_date).toLocaleDateString() : 'Not set'}</span>
                      <span>Training: {placement.training_completed ? 'Completed' : 'Pending'}</span>
                      <span>Payment: {placement.recruitment_fee_paid ? 'Paid' : 'Pending'}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    placement.status === 'active' ? 'bg-green-100 text-green-800' :
                    placement.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {placement.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
