'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Briefcase,
  CreditCard,
  FileText,
  Handshake,
  Users,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types'
import { formatCurrency, formatDate, ROLE_LABELS } from '@/lib/utils'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const PIE_COLORS = ['#1A6B3C', '#C8963E', '#3B82F6', '#8B5CF6']

type RegRow = Pick<
  Profile,
  'full_name' | 'farm_name' | 'role' | 'preferred_region' | 'farm_location' | 'created_at'
>

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [usersByRole, setUsersByRole] = useState({
    farm: 0,
    graduate: 0,
    student: 0,
    skilled: 0,
  })
  const [totalUsers, setTotalUsers] = useState(0)
  const [jobsByStatus, setJobsByStatus] = useState<Record<string, number>>({})
  const [totalJobs, setTotalJobs] = useState(0)
  const [appsByStatus, setAppsByStatus] = useState<Record<string, number>>({})
  const [totalApps, setTotalApps] = useState(0)
  const [placeByStatus, setPlaceByStatus] = useState<Record<string, number>>(
    {}
  )
  const [totalPlaces, setTotalPlaces] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [pendingPay, setPendingPay] = useState(0)
  const [trainingCount, setTrainingCount] = useState(0)
  const [recent, setRecent] = useState<RegRow[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [
        totalUsersR,
        farmR,
        gradR,
        studR,
        skillR,
        jobsTotalR,
        appsTotalR,
        placeTotalR,
        payPendingR,
        trainR,
        recentR,
        jd,
        ja,
        jp,
        jfilled,
        jclosed,
        ad,
        ar,
        ash,
        aa,
        arej,
        pp,
        pa,
        pc,
        pt,
        paidRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .neq('role', 'admin'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'farm'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'graduate'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'skilled'),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('training_sessions')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select(
            'full_name, farm_name, role, preferred_region, farm_location, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'draft'),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'paused'),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'filled'),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'closed'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'reviewed'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'shortlisted'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected'),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'terminated'),
        supabase.from('payments').select('amount').eq('status', 'paid'),
      ])

      if (cancelled) return

      setTotalUsers(totalUsersR.count ?? 0)
      setUsersByRole({
        farm: farmR.count ?? 0,
        graduate: gradR.count ?? 0,
        student: studR.count ?? 0,
        skilled: skillR.count ?? 0,
      })
      setTotalJobs(jobsTotalR.count ?? 0)
      setTotalApps(appsTotalR.count ?? 0)
      setTotalPlaces(placeTotalR.count ?? 0)
      setPendingPay(payPendingR.count ?? 0)
      setTrainingCount(trainR.count ?? 0)
      setRecent((recentR.data as RegRow[]) ?? [])

      setJobsByStatus({
        draft: jd.count ?? 0,
        active: ja.count ?? 0,
        paused: jp.count ?? 0,
        filled: jfilled.count ?? 0,
        closed: jclosed.count ?? 0,
      })

      setAppsByStatus({
        pending: ad.count ?? 0,
        reviewed: ar.count ?? 0,
        shortlisted: ash.count ?? 0,
        accepted: aa.count ?? 0,
        rejected: arej.count ?? 0,
      })

      setPlaceByStatus({
        pending: pp.count ?? 0,
        active: pa.count ?? 0,
        completed: pc.count ?? 0,
        terminated: pt.count ?? 0,
      })

      const sum = (paidRes.data ?? []).reduce(
        (acc, x: { amount: number }) => acc + (Number(x.amount) || 0),
        0
      )
      setRevenue(sum)

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function regName(p: RegRow): string {
    if (p.role === 'farm' && p.farm_name?.trim()) return p.farm_name
    return p.full_name?.trim() || '-'
  }

  function regRegion(p: RegRow): string {
    if (p.role === 'farm') return p.farm_location?.trim() || '-'
    return p.preferred_region?.trim() || '-'
  }

  const pieData = [
    { name: ROLE_LABELS.farm, value: usersByRole.farm },
    { name: ROLE_LABELS.graduate, value: usersByRole.graduate },
    { name: ROLE_LABELS.student, value: usersByRole.student },
    { name: ROLE_LABELS.skilled, value: usersByRole.skilled },
  ]

  const barData = [
    'pending',
    'reviewed',
    'shortlisted',
    'accepted',
    'rejected',
  ].map((status) => ({
    status,
    count: appsByStatus[status] ?? 0,
  }))

  if (loading) {
    return (
      <div className="font-ubuntu mx-auto max-w-7xl space-y-6 p-6">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports and Analytics
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            <p className="mt-1 text-xs text-gray-400">Total users</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Briefcase className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
            <p className="mt-1 text-xs text-gray-400">Total jobs</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalApps}</p>
            <p className="mt-1 text-xs text-gray-400">Applications</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Handshake className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalPlaces}</p>
            <p className="mt-1 text-xs text-gray-400">Placements</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm md:col-span-1 col-span-2">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CreditCard className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(revenue, 'GHS')}
            </p>
            <p className="mt-1 text-xs text-gray-400">Total revenue</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-800">Users by Role</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-800">
              Applications by Status
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1A6B3C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <h2 className="border-b border-gray-50 px-4 py-4 font-semibold text-gray-800">
            Recent Registrations
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, idx) => (
                  <tr
                    key={`${p.created_at}-${idx}`}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-800">{regName(p)}</td>
                    <td className="px-4 py-3">
                      <Pill variant="gray">
                        {ROLE_LABELS[p.role as UserRole] ?? p.role}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{regRegion(p)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(p.created_at ?? undefined)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Pending payments: {pendingPay} · Training sessions: {trainingCount}
        </p>
      </div>
    </div>
  )
}
