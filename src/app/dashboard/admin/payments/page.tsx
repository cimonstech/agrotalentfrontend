'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: ''
  })

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [filters])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError('')

      // Check authentication first
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        router.push('/signin')
        return
      }

      // Use apiClient which includes auth headers
      const data = await apiClient.getAdminPayments({
        status: filters.status || undefined,
        start_date: filters.date_from || undefined,
        end_date: filters.date_to || undefined
      })
      setPayments(data.payments || [])
    } catch (error: any) {
      console.error('Failed to fetch payments:', error)
      setError(error.message || 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const report = await apiClient.getAdminReports('payments')
      if (report.report?.payments) {
        setStats(report.report.payments)
      }
    } catch (error) {
      console.error('Failed to fetch payment stats:', error)
    }
  }

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await apiClient.confirmPayment(paymentId)
      fetchPayments()
      fetchStats()
    } catch (error: any) {
      console.error('Failed to confirm payment:', error)
      alert(error.message || 'Failed to confirm payment')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payments & Fees</h1>
          <p className="text-gray-600 dark:text-gray-400">Track recruitment fees (GHS 200) and payment status</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
              <button
                onClick={fetchPayments}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">GHS {stats.total_revenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Completed Payments</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed_payments || 0}</p>
            </div>
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending_payments || 0}</p>
            </div>
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_payments || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            placeholder="To Date"
          />
          <button
            onClick={() => setFilters({ status: '', date_from: '', date_to: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.farm_name || 'Unknown Farm'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {payment.placement_id ? `Placement #${payment.placement_id.slice(0, 8)}` : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">GHS {payment.amount || '0.00'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmPayment(payment.id)}
                              className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {payment.paystack_reference && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Ref: {payment.paystack_reference.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
