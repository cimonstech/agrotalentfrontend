'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  GraduationCap,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getSessionOnce } from '@/lib/get-session-once'
import type { Profile, UserRole } from '@/types'
import {
  formatCurrency,
  getInitials,
  ROLE_LABELS,
  timeAgo,
} from '@/lib/utils'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import Image from 'next/image'

const supabase = createSupabaseClient()

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null
  return Array.isArray(x) ? x[0] ?? null : x
}

function firstName(full: string | null | undefined) {
  if (!full?.trim()) return 'there'
  return full.trim().split(/\s+/)[0] ?? 'there'
}

function AdminDashboardSkeleton() {
  return (
    <div className="font-ubuntu mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  )
}

type PendingProfile = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'role' | 'created_at'
>

type RecentAppRow = {
  id: string
  status: string
  match_score: number | null
  created_at: string
  jobs: { title: string | null } | null
  applicant: { full_name: string | null } | null
}

type PendingPaymentRow = {
  id: string
  amount: number
  currency: string
  created_at: string
  placements: {
    jobs: { title: string | null } | null
    profiles: { farm_name: string | null } | null
  } | null
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    farms: 0,
    graduates: 0,
    students: 0,
    skilled: 0,
    activeJobs: 0,
    totalApplications: 0,
    activePlacements: 0,
    pendingPayments: 0,
  })
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [recentApps, setRecentApps] = useState<RecentAppRow[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentRow[]>(
    []
  )
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      const session = await getSessionOnce()
      if (!session?.user) {
        router.replace('/signin')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      const me = prof as Profile | null
      setProfile(me)
      if (String(me?.role ?? '').toLowerCase() !== 'admin') {
        router.replace('/signin')
        return
      }

      const [
        totalUsersR,
        farmsR,
        gradsR,
        studsR,
        skilledR,
        activeJobsR,
        appsR,
        placeR,
        payR,
        pendingRes,
        appsRecentRes,
        payListRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
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
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('is_verified', false)
          .neq('role', 'admin')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('applications')
          .select(
            `
            id,
            status,
            match_score,
            created_at,
            jobs ( title ),
            applicant:profiles!applications_applicant_id_fkey ( full_name )
          `
          )
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('payments')
          .select(
            `
            id,
            amount,
            currency,
            created_at,
            placements (
              jobs ( title ),
              profiles!placements_farm_id_fkey ( farm_name )
            )
          `
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      if (cancelled) return

      setStats({
        totalUsers: totalUsersR.count ?? 0,
        farms: farmsR.count ?? 0,
        graduates: gradsR.count ?? 0,
        students: studsR.count ?? 0,
        skilled: skilledR.count ?? 0,
        activeJobs: activeJobsR.count ?? 0,
        totalApplications: appsR.count ?? 0,
        activePlacements: placeR.count ?? 0,
        pendingPayments: payR.count ?? 0,
      })

      setPendingProfiles((pendingRes.data as PendingProfile[]) ?? [])
      setRecentApps((appsRecentRes.data as unknown as RecentAppRow[]) ?? [])
      setPendingPayments(
        (payListRes.data as unknown as PendingPaymentRow[]) ?? []
      )

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleVerify(profileId: string) {
    setProcessing((prev) => ({ ...prev, [profileId]: true }))
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id ?? null,
        })
        .eq('id', profileId)
      if (error) {
        console.error('Verify error:', error)
        alert('Verification failed: ' + error.message)
        return
      }
      setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId))
      void supabase.from('notifications').insert({
        user_id: profileId,
        type: 'verification_approved',
        title: 'Account Verified',
        message:
          'Your account has been verified. You now have full access to all platform features.',
        link: null,
        read: false,
      })
      window.dispatchEvent(new CustomEvent('profile-verified'))
      void fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileId,
          type: 'verification_approved',
        }),
      }).catch(console.error)
    } catch (err) {
      console.error('Verify exception:', err)
    } finally {
      setProcessing((prev) => ({ ...prev, [profileId]: false }))
    }
  }

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  const welcome = firstName(profile?.full_name)

  return (
    <div className="font-ubuntu min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardPageHeader
          greeting='Admin Dashboard'
          subtitle={`Platform overview · ${new Date().toLocaleDateString()}`}
        />

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {(
            [
              {
                label: 'Total Users',
                value: stats.totalUsers,
                icon: Users,
                iconWrap: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Farms',
                value: stats.farms,
                icon: Building2,
                iconWrap: 'bg-green-50 text-green-600',
              },
              {
                label: 'Graduates',
                value: stats.graduates,
                icon: GraduationCap,
                iconWrap: 'bg-purple-50 text-purple-600',
              },
              {
                label: 'Students',
                value: stats.students,
                icon: BookOpen,
                iconWrap: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Skilled',
                value: stats.skilled,
                icon: Wrench,
                iconWrap: 'bg-orange-50 text-orange-600',
              },
            ] as const
          ).map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconWrap}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-1 text-xs text-gray-400">{s.label}</p>
              </div>
            )
          })}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-brand">
              <Briefcase className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeJobs}
            </p>
            <p className="mt-1 text-xs text-gray-400">Active Jobs</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalApplications}
            </p>
            <p className="mt-1 text-xs text-gray-400">Total Applications</p>
          </div>
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-600">
              <UserCheck className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activePlacements}
            </p>
            <p className="mt-1 text-xs text-gray-400">Active Placements</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 transition-shadow hover:shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600">
              <CreditCard className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pendingPayments}
            </p>
            <p className="mt-1 text-xs text-gray-400">Pending Payments</p>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Pending Verifications
              </h2>
              <Link
                href="/dashboard/admin/verification"
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            </div>
            <ul>
              {pendingProfiles.length === 0 ? (
                <li className="py-8 text-center text-sm text-gray-400">
                  No pending profiles
                </li>
              ) : (
                pendingProfiles.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {getInitials(u.full_name ?? u.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {u.full_name ?? u.email}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Pill variant="gray">
                          {ROLE_LABELS[u.role as UserRole] ?? u.role}
                        </Pill>
                        <span className="text-xs text-gray-400">{u.email}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {u.created_at ? timeAgo(u.created_at) : '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!!processing[u.id]}
                      onClick={() => void handleVerify(u.id)}
                      className="flex-shrink-0 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
                    >
                      {processing[u.id] ? 'Verifying...' : 'Verify'}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Recent Applications
              </h2>
              <Link
                href="/dashboard/admin/applications"
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            </div>
            <ul>
              {recentApps.length === 0 ? (
                <li className="py-8 text-center text-sm text-gray-400">
                  No applications
                </li>
              ) : (
                recentApps.map((a) => {
                  const score = Math.min(
                    100,
                    Math.max(0, a.match_score ?? 0)
                  )
                  return (
                    <li
                      key={a.id}
                      className="border-b border-gray-50 py-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {one(a.applicant)?.full_name ?? 'Applicant'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {one(a.jobs)?.title ?? 'Job'}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={a.status} />
                          <span className="text-xs text-gray-400">
                            {timeAgo(a.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          Match: {score}%
                        </span>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Pending Payments</h2>
            <Link
              href="/dashboard/admin/payments"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          {pendingPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CreditCard className="mb-2 h-10 w-10 opacity-40" aria-hidden />
              <p className="text-sm">No pending payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3 pl-0 pr-4">Farm</th>
                    <th className="py-3 px-4">Job</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 pr-0 text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p) => {
                    const pl = one(p.placements)
                    const farm = one(pl?.profiles)
                    const job = one(pl?.jobs)
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 pl-0 pr-4 font-medium text-gray-800">
                          {farm?.farm_name ?? 'Farm'}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {job?.title ?? 'Placement'}
                        </td>
                        <td className="py-3 px-4 text-gray-800">
                          {formatCurrency(p.amount, p.currency ?? 'GHS')}
                        </td>
                        <td className="py-3 pr-0 text-right text-xs text-gray-400">
                          {timeAgo(p.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
