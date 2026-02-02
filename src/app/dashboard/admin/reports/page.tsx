'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

// Lazy-load heavy chart components (only loaded when charts are rendered)
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
)
const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
)
const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
)
const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
)
const Pie = dynamic(
  () => import('recharts').then(mod => mod.Pie),
  { ssr: false }
)
const Cell = dynamic(
  () => import('recharts').then(mod => mod.Cell),
  { ssr: false }
)

// xlsx and jspdf are loaded on-demand when export buttons are clicked

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detailed tables
  const [placements, setPlacements] = useState<any[]>([])
  const [placementsLoading, setPlacementsLoading] = useState(false)
  const [placementsFilters, setPlacementsFilters] = useState({
    status: '',
    region: '',
  })
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsFilters, setPaymentsFilters] = useState({
    status: ''
  })

  const [selectedPlacements, setSelectedPlacements] = useState<Record<string, boolean>>({})
  const [selectedPayments, setSelectedPayments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchReport()
  }, [reportType, startDate, endDate])

  useEffect(() => {
    // Load detailed lists for export/filtering
    fetchPlacements()
  }, [placementsFilters, startDate, endDate])

  useEffect(() => {
    fetchPayments()
  }, [paymentsFilters, startDate, endDate])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminReports(reportType, {
        start_date: startDate || undefined,
        end_date: endDate || undefined
      })
      setReport(data.report)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlacements = async () => {
    try {
      setPlacementsLoading(true)
      const data = await apiClient.getAdminPlacements({
        status: placementsFilters.status,
        region: placementsFilters.region,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 200
      })
      setPlacements(data.placements || [])
      setSelectedPlacements({})
    } catch (e) {
      console.error('Failed to fetch placements:', e)
    } finally {
      setPlacementsLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true)
      const data = await apiClient.getAdminPayments({
        status: paymentsFilters.status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 200
      })
      setPayments(data.payments || [])
      setSelectedPayments({})
    } catch (e) {
      console.error('Failed to fetch payments:', e)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const exportExcel = async () => {
    if (!report) return
    // Lazy-load xlsx only when needed
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    if (report.overview) {
      const overviewRows = Object.entries(report.overview).map(([k, v]) => ({
        metric: String(k),
        value: Number(v)
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewRows), 'Overview')
    }

    if (report.regional) {
      const regionalRows = Object.entries(report.regional).map(([region, count]) => ({
        region,
        placements: Number(count)
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regionalRows), 'Regional')
    }

    if (report.payments) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([report.payments]), 'Payments')
    }

    if (report.training) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([report.training]), 'Training')
    }

    const selectedPlacementRows = placements
      .filter(p => selectedPlacements[p.id])
      .map(p => ({
        id: p.id,
        status: p.status,
        job: p.jobs?.title,
        region: p.jobs?.location,
        farm: p.farm?.farm_name,
        graduate: p.graduate?.full_name,
        created_at: p.created_at
      }))
    if (selectedPlacementRows.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(selectedPlacementRows), 'Placements_Selected')
    }

    const selectedPaymentRows = payments
      .filter(p => selectedPayments[p.id])
      .map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        paystack_reference: p.paystack_reference,
        placement_id: p.placement_id,
        farm: p.placements?.farm?.farm_name,
        job: p.placements?.jobs?.title,
        created_at: p.created_at
      }))
    if (selectedPaymentRows.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(selectedPaymentRows), 'Payments_Selected')
    }

    XLSX.writeFile(wb, `agrotalenthub-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportPdf = async () => {
    if (!report) return
    // Lazy-load jspdf and jspdf-autotable only when needed
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    doc.setFontSize(16)
    doc.text('AgroTalent Hub — Reports & Analytics', 40, 40)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58)
    if (startDate || endDate) doc.text(`Range: ${startDate || '—'} to ${endDate || '—'}`, 40, 74)

    let y = 95

    if (report.overview) {
      doc.setFontSize(12)
      doc.text('Overview', 40, y)
      y += 10
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: Object.entries(report.overview).map(([k, v]) => [String(k), String(v)]),
      })
      y = (doc as any).lastAutoTable.finalY + 20
    }

    if (report.regional) {
      doc.setFontSize(12)
      doc.text('Regional', 40, y)
      y += 10
      autoTable(doc, {
        startY: y,
        head: [['Region', 'Placements']],
        body: Object.entries(report.regional).map(([r, c]) => [String(r), String(c)]),
      })
      y = (doc as any).lastAutoTable.finalY + 20
    }

    if (report.payments) {
      doc.setFontSize(12)
      doc.text('Payments', 40, y)
      y += 10
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: Object.entries(report.payments).map(([k, v]) => [String(k), String(v)]),
      })
      y = (doc as any).lastAutoTable.finalY + 20
    }

    if (report.training) {
      doc.setFontSize(12)
      doc.text('Training', 40, y)
      y += 10
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: Object.entries(report.training).map(([k, v]) => [String(k), String(v)]),
      })
      y = (doc as any).lastAutoTable.finalY + 20
    }

    const selectedPlacementsRows = placements.filter(p => selectedPlacements[p.id])
    if (selectedPlacementsRows.length) {
      doc.addPage()
      doc.setFontSize(12)
      doc.text('Placements (Selected)', 40, 40)
      autoTable(doc, {
        startY: 60,
        head: [['Status', 'Job', 'Region', 'Farm', 'Graduate', 'Created']],
        body: selectedPlacementsRows.map(p => [
          p.status,
          p.jobs?.title || '',
          p.jobs?.location || '',
          p.farm?.farm_name || '',
          p.graduate?.full_name || '',
          new Date(p.created_at).toLocaleDateString()
        ]),
      })
    }

    const selectedPaymentsRows = payments.filter(p => selectedPayments[p.id])
    if (selectedPaymentsRows.length) {
      doc.addPage()
      doc.setFontSize(12)
      doc.text('Payments (Selected)', 40, 40)
      autoTable(doc, {
        startY: 60,
        head: [['Status', 'Amount', 'Farm', 'Job', 'Ref', 'Created']],
        body: selectedPaymentsRows.map(p => [
          p.status,
          `GHS ${p.amount}`,
          p.placements?.farm?.farm_name || '',
          p.placements?.jobs?.title || '',
          p.paystack_reference || '',
          new Date(p.created_at).toLocaleDateString()
        ]),
      })
    }

    doc.save(`agrotalenthub-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const COLORS = ['#1f7a4d', '#4f46e5', '#f59e0b', '#ef4444', '#0ea5e9']
  const overviewBars = report?.overview
    ? [
        { name: 'Farms', value: report.overview.farms || 0 },
        { name: 'Graduates', value: report.overview.graduates || 0 },
        { name: 'Students', value: report.overview.students || 0 },
      ]
    : []

  const verificationPie = report?.overview
    ? [
        { name: 'Verified', value: report.overview.verified_users || 0 },
        {
          name: 'Pending',
          value: Math.max(
            0,
            (report.overview.total_users || 0) - (report.overview.verified_users || 0)
          )
        }
      ]
    : []

  const regionalData = report?.regional
    ? Object.entries(report.regional).map(([region, count]) => ({ region, placements: Number(count) }))
    : []

  const paymentsPie = report?.payments
    ? [
        { name: 'Completed', value: report.payments.completed_payments || 0 },
        { name: 'Pending', value: report.payments.pending_payments || 0 },
      ]
    : []

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">View platform statistics and analytics</p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-background-dark p-4 rounded-xl border border-gray-200 dark:border-white/10">
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="overview">Overview</option>
              <option value="regional">Regional</option>
              <option value="payments">Payments</option>
              <option value="training">Training</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={exportPdf}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Export PDF
            </button>
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Export Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        ) : report && (
          <div className="space-y-6">
            {report.overview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Overview Statistics</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.entries(report.overview).map(([key, value]) => (
                        <div key={key} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value as number}</p>
                        </div>
                      ))}
                    </div>

                    <div className="h-64 bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Users by Role</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overviewBars}>
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Verification Status</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={verificationPie}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {verificationPie.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {report.regional && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
              >
                <h2 className="text-xl font-bold mb-4">Regional Deployment</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80 bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Placements by Region</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalData}>
                        <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={80} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="placements" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-auto">
                    {regionalData
                      .slice()
                      .sort((a, b) => b.placements - a.placements)
                      .map((r) => (
                        <div key={r.region} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                          <span className="font-medium text-gray-900 dark:text-white">{r.region}</span>
                          <span className="text-primary font-bold">{r.placements} placements</span>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {report.payments && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
              >
                <h2 className="text-xl font-bold mb-4">Payment Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">GHS {report.payments.total_revenue?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.payments.completed_payments || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.payments.pending_payments || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.payments.total_payments || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64 bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Status Mix</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentsPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
                          {paymentsPie.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tip</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use the detailed Payments table below to filter, sort, bulk-select, and export specific records.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {report.training && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
              >
                <h2 className="text-xl font-bold mb-4">Training Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.training.total_sessions || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.training.total_attendance || 0}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detailed Placements Table (filters + selection + export) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Placements (Detailed)</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {Object.values(selectedPlacements).filter(Boolean).length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <select
                  value={placementsFilters.status}
                  onChange={(e) => setPlacementsFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="training">Training</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="terminated">Terminated</option>
                </select>
                <input
                  value={placementsFilters.region}
                  onChange={(e) => setPlacementsFilters(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Filter by region..."
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                />
                <button
                  onClick={() => {
                    const all = placements.reduce((acc: any, p: any) => {
                      acc[p.id] = true
                      return acc
                    }, {})
                    setSelectedPlacements(all)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedPlacements({})}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Clear Selection
                </button>
              </div>

              {placementsLoading ? (
                <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading placements...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Select</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Job</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Region</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Farm</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Graduate</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {placements.slice(0, 200).map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!selectedPlacements[p.id]}
                              onChange={(e) => setSelectedPlacements(prev => ({ ...prev, [p.id]: e.target.checked }))}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">{p.status}</td>
                          <td className="px-4 py-3 text-sm">{p.jobs?.title || '—'}</td>
                          <td className="px-4 py-3 text-sm">{p.jobs?.location || '—'}</td>
                          <td className="px-4 py-3 text-sm">{p.farm?.farm_name || '—'}</td>
                          <td className="px-4 py-3 text-sm">{p.graduate?.full_name || '—'}</td>
                          <td className="px-4 py-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Detailed Payments Table (filters + selection + export) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Payments (Detailed)</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {Object.values(selectedPayments).filter(Boolean).length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <select
                  value={paymentsFilters.status}
                  onChange={(e) => setPaymentsFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <button
                  onClick={() => {
                    const all = payments.reduce((acc: any, p: any) => {
                      acc[p.id] = true
                      return acc
                    }, {})
                    setSelectedPayments(all)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedPayments({})}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Clear Selection
                </button>
              </div>

              {paymentsLoading ? (
                <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading payments...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Select</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Farm</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Job</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Ref</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {payments.slice(0, 200).map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!selectedPayments[p.id]}
                              onChange={(e) => setSelectedPayments(prev => ({ ...prev, [p.id]: e.target.checked }))}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">{p.status}</td>
                          <td className="px-4 py-3 text-sm">GHS {Number(p.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">{p.placements?.farm?.farm_name || '—'}</td>
                          <td className="px-4 py-3 text-sm">{p.placements?.jobs?.title || '—'}</td>
                          <td className="px-4 py-3 text-sm">{p.paystack_reference ? String(p.paystack_reference).slice(0, 10) + '…' : '—'}</td>
                          <td className="px-4 py-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
