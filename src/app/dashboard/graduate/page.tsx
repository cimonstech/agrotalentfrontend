'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  ClipboardList,
  Clock,
  Handshake,
  Megaphone,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatSalaryRange, timeAgo } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

function firstName(full: string | null | undefined) {
  if (!full?.trim()) return 'there'
  return full.trim().split(/\s+/)[0] ?? 'there'
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
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

type AppRow = {
  id: string
  status: string
  created_at: string
  jobs: { title: string; location: string } | null
}

type JobRow = {
  id: string
  title: string
  location: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  farm_id: string
  profiles: { farm_name: string | null } | null
}

export default function GraduateDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    totalApps: 0,
    pendingApps: 0,
    acceptedApps: 0,
    activePlacements: 0,
  })
  const [recentApps, setRecentApps] = useState<AppRow[]>([])
  const [matchedJobs, setMatchedJobs] = useState<JobRow[]>([])
  const [unreadNotice, setUnreadNotice] = useState<{
    id: string
    title: string
  } | null>(null)
  const [hasApplied, setHasApplied] = useState(false)

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
      setProfile(prof as Profile | null)

      const [
        totalR,
        pendR,
        accR,
        placeR,
        appsRes,
        jobsRes,
        noticesRes,
        readsRes,
      ] = await Promise.all([
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', uid),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', uid)
          .eq('status', 'pending'),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', uid)
          .eq('status', 'accepted'),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('graduate_id', uid)
          .eq('status', 'active'),
        supabase
          .from('applications')
          .select(
            `
            id,
            status,
            created_at,
            jobs ( title, location )
          `
          )
          .eq('applicant_id', uid)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('jobs')
          .select(
            `
            id,
            title,
            location,
            salary_min,
            salary_max,
            salary_currency,
            farm_id,
            profiles!jobs_farm_id_fkey ( farm_name )
          `
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('notices')
          .select('id, title, created_at')
          .or('audience.eq.all,audience.eq.graduate')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('notice_reads').select('notice_id').eq('user_id', uid),
      ])

      if (cancelled) return

      setStats({
        totalApps: totalR.count ?? 0,
        pendingApps: pendR.count ?? 0,
        acceptedApps: accR.count ?? 0,
        activePlacements: placeR.count ?? 0,
      })
      setHasApplied((totalR.count ?? 0) > 0)

      const appsData = appsRes.data as AppRow[] | null
      setRecentApps(appsData ?? [])

      const jrows = (jobsRes.data ?? []) as unknown as JobRow[]
      setMatchedJobs(jrows)

      const readIds = new Set(
        (readsRes.data ?? []).map((r: { notice_id: string }) => r.notice_id)
      )
      const notices = noticesRes.data ?? []
      const unread = notices.find((n: { id: string }) => !readIds.has(n.id))
      setUnreadNotice(unread ? { id: unread.id, title: unread.title } : null)

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

  const welcome = firstName(profile?.full_name)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1400px] space-y-8 p-4 md:p-6">
        {unreadNotice ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-900">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 shrink-0" aria-hidden />
              <span className="font-medium">{unreadNotice.title}</span>
            </div>
            <Link
              href="/dashboard/graduate/notices"
              className="text-sm font-semibold text-green-800 underline hover:no-underline"
            >
              Read notice
            </Link>
          </div>
        ) : null}

        {profile ? (
          <OnboardingChecklist profile={profile} hasApplied={hasApplied} />
        ) : null}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {welcome}
          </h1>
          <p className="mt-1 text-gray-600">
            Your applications, placements, and job opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total applications"
            value={stats.totalApps}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatCard
            label="Pending applications"
            value={stats.pendingApps}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            label="Accepted applications"
            value={stats.acceptedApps}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            label="Active placement"
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
                href="/dashboard/graduate/applications"
                className="text-sm font-medium text-green-800 hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentApps.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500">
                  No applications yet
                </li>
              ) : (
                recentApps.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {a.jobs?.title ?? 'Job'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {a.jobs?.location ?? '-'}
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Matched jobs
              </h2>
              <Link
                href="/dashboard/graduate/jobs"
                className="text-sm font-medium text-green-800 hover:underline"
              >
                Browse all jobs
              </Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {matchedJobs.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500">
                  No jobs to show
                </li>
              ) : (
                matchedJobs.map((j) => (
                  <li key={j.id} className="py-3">
                    <Link
                      href={`/dashboard/graduate/jobs/${j.id}`}
                      className="block hover:opacity-90"
                    >
                      <p className="font-medium text-gray-900">{j.title}</p>
                      <p className="text-sm text-gray-600">
                        {j.profiles?.farm_name ?? 'Farm'} - {j.location}
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatSalaryRange(
                          j.salary_min,
                          j.salary_max,
                          j.salary_currency ?? 'GHS'
                        )}
                      </p>
                    </Link>
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
