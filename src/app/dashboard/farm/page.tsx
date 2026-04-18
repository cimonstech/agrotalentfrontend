'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  ClipboardList,
  Clock,
  Handshake,
  PlusCircle,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatDate, JOB_TYPES, timeAgo } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

function firstName(full: string | null | undefined) {
  if (!full?.trim()) return 'there'
  return full.trim().split(/\s+/)[0] ?? 'there'
}

function jobTypeLabel(v: string) {
  return JOB_TYPES.find((j) => j.value === v)?.label ?? v
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-72 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  )
}

type FarmAppRow = {
  id: string
  status: string
  match_score: number | null
  created_at: string
  jobs: { title: string; farm_id: string } | null
  applicant: { full_name: string | null; preferred_region: string | null } | null
}

type FarmJobRow = {
  id: string
  title: string
  job_type: string
  location: string
  application_count: number | null
  expires_at: string | null
  status: string
}

export default function FarmDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApps: 0,
    pendingReview: 0,
    activePlacements: 0,
  })
  const [recentApps, setRecentApps] = useState<FarmAppRow[]>([])
  const [activeJobRows, setActiveJobRows] = useState<FarmJobRow[]>([])
  const [hasPostedJob, setHasPostedJob] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/signin')
        return
      }
      const uid = session.user.id

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled) return
      const p = prof as Profile | null
      setProfile(p)
      if (!p?.id) {
        setLoading(false)
        return
      }
      const farmId = p.id

      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id')
        .eq('farm_id', farmId)
      const jobIds = (jobRows ?? []).map((j) => j.id)

      const [
        activeJobsR,
        jobsPostedR,
        totalAppsR,
        pendingAppsR,
        placeR,
        recentRes,
        activeJobsListRes,
      ] = await Promise.all([
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('farm_id', farmId)
          .eq('status', 'active'),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('farm_id', farmId),
        jobIds.length
          ? supabase
              .from('applications')
              .select('id', { count: 'exact', head: true })
              .in('job_id', jobIds)
          : Promise.resolve({ count: 0, error: null }),
        jobIds.length
          ? supabase
              .from('applications')
              .select('id', { count: 'exact', head: true })
              .in('job_id', jobIds)
              .eq('status', 'pending')
          : Promise.resolve({ count: 0, error: null }),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('farm_id', farmId)
          .eq('status', 'active'),
        supabase
          .from('applications')
          .select(
            `
            id,
            status,
            match_score,
            created_at,
            jobs!inner ( title, farm_id ),
            applicant:profiles!applications_applicant_id_fkey ( full_name, preferred_region )
          `
          )
          .eq('jobs.farm_id', farmId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('jobs')
          .select(
            'id, title, job_type, location, application_count, expires_at, status'
          )
          .eq('farm_id', farmId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      if (cancelled) return

      setStats({
        activeJobs: activeJobsR.count ?? 0,
        totalApps: totalAppsR.count ?? 0,
        pendingReview: pendingAppsR.count ?? 0,
        activePlacements: placeR.count ?? 0,
      })
      setHasPostedJob((jobsPostedR.count ?? 0) > 0)

      const recentData = recentRes.data as FarmAppRow[] | null
      setRecentApps(recentData ?? [])

      const aj = activeJobsListRes.data as FarmJobRow[] | null
      setActiveJobRows(aj ?? [])

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) {
    return <DashboardSkeleton />
  }

  const welcome = firstName(profile?.full_name ?? profile?.farm_name)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1400px] space-y-8 p-6">
        {profile && !profile.is_verified ? (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mt-0.5 h-5 w-5 shrink-0 text-amber-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Account Pending Verification
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                Your farm account is under review. You cannot post jobs until
                verified by an admin.
              </p>
            </div>
          </div>
        ) : null}

        {profile ? (
          <OnboardingChecklist profile={profile} hasPostedJob={hasPostedJob} />
        ) : null}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {welcome}
          </h1>
          <p className="mt-1 text-gray-600">
            Manage job posts, applications, and placements
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active jobs"
            value={stats.activeJobs}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            label="Total applications"
            value={stats.totalApps}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatCard
            label="Pending review"
            value={stats.pendingReview}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            label="Active placements"
            value={stats.activePlacements}
            icon={<Handshake className="h-5 w-5" />}
          />
        </div>

        {profile ? (
          <ProfileStrength profile={profile} className="mb-6" />
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent applications
              </h2>
              <Link
                href="/dashboard/farm/applications"
                className="text-sm font-medium text-green-800 hover:underline"
              >
                View all applications
              </Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentApps.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500">
                  No applications yet
                </li>
              ) : (
                recentApps.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {a.applicant?.full_name ?? 'Applicant'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {a.jobs?.title ?? 'Job'} -{' '}
                        {a.applicant?.preferred_region ?? '-'}
                      </p>
                      <p className="text-sm text-gray-700">
                        Match: {a.match_score ?? 0}%
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-gray-500">
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Active jobs
              </h2>
              <div className="flex gap-3 text-sm font-medium text-green-800">
                <Link href="/dashboard/farm/jobs/new" className="hover:underline">
                  Post new job
                </Link>
                <Link href="/dashboard/farm/jobs" className="hover:underline">
                  Manage jobs
                </Link>
              </div>
            </div>
            <ul className="divide-y divide-gray-100">
              {activeJobRows.length === 0 ? (
                <li className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-gray-500">No active jobs</p>
                  <Link
                    href="/dashboard/farm/jobs/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden />
                    Post new job
                  </Link>
                </li>
              ) : (
                activeJobRows.map((j) => (
                  <li key={j.id} className="py-3">
                    <p className="font-medium text-gray-900">{j.title}</p>
                    <p className="text-sm text-gray-600">
                      {jobTypeLabel(j.job_type)} - {j.location}
                    </p>
                    <p className="text-sm text-gray-700">
                      Applications: {j.application_count ?? 0} - Expires{' '}
                      {formatDate(j.expires_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
