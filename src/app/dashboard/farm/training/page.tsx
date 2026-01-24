'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export default function FarmTrainingPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  useEffect(() => {
    fetchSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTrainingSessions({
        upcoming: filter === 'upcoming' ? 'true' : ''
      })
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch training sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Training</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and attend assigned trainings (for managers/teams)</p>
        </div>

        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="upcoming">Upcoming</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">Loading trainings...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-chalkboard-teacher text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No trainings assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{session.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(session.scheduled_at).toLocaleString()}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {session.duration_minutes} minutes
                      </span>
                      {session.category && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium capitalize">
                          {String(session.category)}
                        </span>
                      )}
                      {session.my_attendance_status && (
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          session.my_attendance_status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          session.my_attendance_status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {session.my_attendance_status}
                        </span>
                      )}
                    </div>
                    {session.zoom_link && (
                      <div className="mt-4">
                        <a
                          href={session.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors inline-block"
                        >
                          <i className="fas fa-video mr-2"></i>
                          Join Training
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

