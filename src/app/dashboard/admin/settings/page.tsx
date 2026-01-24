'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    recruitment_fee: 200,
    salary_benchmark_min: 500,
    salary_benchmark_max: 2000,
    email_notifications_enabled: true,
    sms_notifications_enabled: false
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await apiClient.getAdminSettings()
      setSettings(prev => ({ ...prev, ...(data.settings || {}) }))
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await apiClient.updateAdminSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage platform settings, fees, and policies</p>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-8">
          <div className="space-y-8">
            {/* Payment Settings */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recruitment Fee (GHS)
                  </label>
                  <input
                    type="number"
                    value={settings.recruitment_fee}
                    onChange={(e) => setSettings({ ...settings, recruitment_fee: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salary Benchmark Min (GHS)
                  </label>
                  <input
                    type="number"
                    value={settings.salary_benchmark_min}
                    onChange={(e) => setSettings({ ...settings, salary_benchmark_min: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Salary Benchmark Max (GHS)
                  </label>
                  <input
                    type="number"
                    value={settings.salary_benchmark_max}
                    onChange={(e) => setSettings({ ...settings, salary_benchmark_max: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enable email notifications for system events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.email_notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                    className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Notifications</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enable SMS notifications for critical updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sms_notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, sms_notifications_enabled: e.target.checked })}
                    className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              {saved && (
                <span className="mr-4 text-green-600 dark:text-green-400 flex items-center">
                  <i className="fas fa-check-circle mr-2"></i>
                  Settings saved!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
