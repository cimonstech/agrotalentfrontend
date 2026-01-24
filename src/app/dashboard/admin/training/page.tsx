'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'

export default function AdminTrainingPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({ category: '', region: '', status: '' })
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    session_type: 'pre_employment',
    category: 'graduate',
    region: '',
    trainer_name: '',
    trainer_type: 'admin',
    scheduled_at: '',
    duration_minutes: 60,
    zoom_link: '',
    attendance_method: 'manual'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [filters])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminTrainings(filters)
      setSessions(data.trainings || [])
    } catch (error) {
      console.error('Failed to fetch training sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      await apiClient.createAdminTraining(createForm)
      setShowCreateModal(false)
      setCreateForm({
        title: '',
        description: '',
        session_type: 'pre_employment',
        category: 'graduate',
        region: '',
        trainer_name: '',
        trainer_type: 'admin',
        scheduled_at: '',
        duration_minutes: 60,
        zoom_link: '',
        attendance_method: 'manual'
      })
      fetchSessions()
    } catch (e: any) {
      alert(e.message || 'Failed to create training')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Training & Onboarding</h1>
            <p className="text-gray-600 dark:text-gray-400">Create sessions, assign participants, mark attendance, and keep proof records</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Create Session
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="graduate">Graduate</option>
            <option value="worker">Worker</option>
            <option value="manager">Manager</option>
          </select>
          <input
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            placeholder="Region (e.g. Ashanti)"
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => setFilters({ category: '', region: '', status: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading training sessions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <i className="fas fa-chalkboard-teacher text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">No training sessions found</p>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        <Link href={`/dashboard/admin/training/${session.id}`} className="hover:underline">
                          {session.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {session.category || 'training'} • {session.region || '—'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <i className="fas fa-calendar mr-2"></i>
                      {new Date(session.scheduled_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <i className="fas fa-clock mr-2"></i>
                      Duration: {session.duration_minutes || 60} minutes
                    </p>
                    {session.zoom_link && (
                      <a
                        href={session.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        <i className="fas fa-video mr-2"></i>
                        Join Zoom Session
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/admin/training/${session.id}`}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-center"
                    >
                      <i className="fas fa-users mr-2"></i>
                      Manage Participants & Attendance
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 my-8">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Training Session</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                    placeholder="Farm Safety & Work Ethics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Session Type</label>
                  <select
                    value={createForm.session_type}
                    onChange={(e) => setCreateForm({ ...createForm, session_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                  >
                    <option value="pre_employment">Pre-employment</option>
                    <option value="orientation">Orientation</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                  >
                    <option value="graduate">Graduate</option>
                    <option value="worker">Worker</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <input
                    value={createForm.region}
                    onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                    placeholder="Ashanti"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trainer</label>
                  <input
                    value={createForm.trainer_name}
                    onChange={(e) => setCreateForm({ ...createForm, trainer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                    placeholder="Admin / External"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={createForm.scheduled_at}
                    onChange={(e) => setCreateForm({ ...createForm, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={createForm.duration_minutes}
                    onChange={(e) => setCreateForm({ ...createForm, duration_minutes: parseInt(e.target.value || '60') })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Zoom Link</label>
                  <input
                    value={createForm.zoom_link}
                    onChange={(e) => setCreateForm({ ...createForm, zoom_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                    placeholder="https://zoom.us/..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
