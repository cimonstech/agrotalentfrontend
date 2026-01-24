'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// apiClient is used elsewhere; keeping import for future expansion
import { apiClient } from '@/lib/api-client'

export default function AdminCommunicationsPage() {
  const [messageLogs, setMessageLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendForm, setSendForm] = useState({
    type: 'email',
    recipients: 'all',
    subject: '',
    message: ''
  })
  const [singleEmail, setSingleEmail] = useState('')

  useEffect(() => {
    fetchMessageLogs()
  }, [])

  const fetchMessageLogs = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCommunicationLogs(50)
      setMessageLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch message logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    try {
      setSending(true)
      setError('')

      const payload: any = { ...sendForm }
      if (sendForm.recipients === 'single') {
        payload.email = singleEmail
      }

      const data = await apiClient.sendCommunication(payload)
      alert(data.message || 'Message sent')
      setShowSendModal(false)
      setSendForm({ type: 'email', recipients: 'all', subject: '', message: '' })
      setSingleEmail('')
      fetchMessageLogs()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setError(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Communications</h1>
            <p className="text-gray-600 dark:text-gray-400">Send SMS & Email notifications, view message logs</p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Send Message
          </button>
        </div>

        {/* Message Logs */}
        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading message logs...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recipients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {messageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No message logs found
                      </td>
                    </tr>
                  ) : (
                    messageLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {log.recipient_count || 0} recipients
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {log.subject || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            log.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Send Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl shadow-xl max-w-2xl w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Message</h2>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={sendForm.type}
                    onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipients</label>
                  <select
                    value={sendForm.recipients}
                    onChange={(e) => setSendForm({ ...sendForm, recipients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="all">All Users</option>
                    <option value="farms">Farms Only</option>
                    <option value="graduates">Graduates Only</option>
                    <option value="students">Students Only</option>
                    <option value="single">Single User (by email)</option>
                  </select>
                </div>

                {sendForm.recipients === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Email</label>
                    <input
                      type="email"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                      placeholder="user@example.com"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={sendForm.subject}
                    onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea
                    value={sendForm.message}
                    onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="px-5 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
