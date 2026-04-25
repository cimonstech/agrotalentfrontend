'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Calendar,
  ClipboardList,
  GraduationCap,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatDate, JOB_TYPES } from '@/lib/utils'
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
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

type JobRow = {
  id: string
  title: string
  location: string
  job_type: string
  expires_at: string | null
}

type SessionRow = {
  title: string
  session_type: string
  scheduled_at: string
  zoom_link: string | null
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    availableJobs: 0,
    myApplications: 0,
    trainingSessions: 0,
    upcomingSessions: 0,
  })
  const [recentJobs, setRecentJobs] = useState<JobRow[]>([])
  const [upcomingTraining, setUpcomingTraining] = useState<SessionRow[]>([])
  const [hasCvDocument, setHasCvDocument] = useState(false)
  const [hasCertificateDocument, setHasCertificateDocument] = useState(false)
  const [hasSupportingDocuments, setHasSupportingDocuments] = useState(false)

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
        availR,
        appsR,
        tpRes,
        jobsRes,
        tpListRes,
        docsRes,
      ] = await Promise.all([
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .in('job_type', ['intern', 'nss']),
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', uid),
        supabase
          .from('training_participants')
          .select('id', { count: 'exact', head: true })
          .eq('participant_id', uid),
        supabase
          .from('jobs')
          .select('id, title, location, job_type, expires_at')
          .eq('status', 'active')
          .in('job_type', ['intern', 'nss'])
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('training_participants')
          .select(
            `
            id,
            training_sessions ( title, session_type, scheduled_at, zoom_link )
          `
          )
          .eq('participant_id', uid),
        supabase
          .from('documents')
          .select('document_type')
          .eq('user_id', uid),
      ])

      if (cancelled) return

      const docRows = docsRes.data as { document_type: string }[] | null
      const types = new Set((docRows ?? []).map((d) => d.document_type))
      setHasCvDocument(types.has('cv'))
      setHasCertificateDocument(types.has('certificate'))
      setHasSupportingDocuments(
        types.has('transcript') || types.has('nss_letter')
      )

      const tpRows = tpListRes.data ?? []
      const nowMs = Date.now()
      let upcoming = 0
      const upcomingList: SessionRow[] = []
      for (const row of tpRows) {
        const raw = row.training_sessions as
          | SessionRow
          | SessionRow[]
          | null
        const ts = Array.isArray(raw) ? raw[0] : raw
        if (!ts?.scheduled_at) continue
        if (new Date(ts.scheduled_at).getTime() > nowMs) {
          upcoming += 1
          upcomingList.push(ts)
        }
      }
      upcomingList.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      )
      const top3 = upcomingList.slice(0, 3)

      setStats({
        availableJobs: availR.count ?? 0,
        myApplications: appsR.count ?? 0,
        trainingSessions: tpRes.count ?? 0,
        upcomingSessions: upcoming,
      })

      setRecentJobs((jobsRes.data as JobRow[]) ?? [])
      setUpcomingTraining(top3)

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
        {profile ? (
          <OnboardingChecklist
            profile={profile}
            hasApplied={stats.myApplications > 0}
            hasTrainingParticipation={stats.trainingSessions > 0}
            hasCvDocument={hasCvDocument}
            hasCertificateDocument={hasCertificateDocument}
            hasSupportingDocuments={hasSupportingDocuments}
          />
        ) : null}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {welcome}
          </h1>
          <p className="mt-1 text-gray-600">
            Internships, NSS roles, and training in one place
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Available jobs"
            value={stats.availableJobs}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <Link
            href="/dashboard/student/applications"
            className="block rounded-xl transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <StatCard
              label="My applications"
              value={stats.myApplications}
              icon={<ClipboardList className="h-5 w-5" />}
            />
          </Link>
          <StatCard
            label="Training sessions"
            value={stats.trainingSessions}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            label="Upcoming sessions"
            value={stats.upcomingSessions}
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        {profile ? (
          <ProfileStrength
            profile={profile}
            className="mb-6"
            hasCvDocument={hasCvDocument}
            hasCertificateDocument={hasCertificateDocument}
            hasSupportingDocuments={hasSupportingDocuments}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent jobs
              </h2>
              <Link
                href="/dashboard/student/jobs"
                className="text-sm font-medium text-green-800 hover:underline"
              >
                Browse all
              </Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentJobs.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500">
                  No roles listed yet
                </li>
              ) : (
                recentJobs.map((j) => (
                  <li key={j.id} className="py-3">
                    <p className="font-medium text-gray-900">{j.title}</p>
                    <p className="text-sm text-gray-600">{j.location}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={j.job_type}
                        label={jobTypeLabel(j.job_type)}
                      />
                      <span className="text-sm text-gray-700">
                        Closes {formatDate(j.expires_at)}
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
                Upcoming training
              </h2>
              <Link
                href="/dashboard/student/training"
                className="text-sm font-medium text-green-800 hover:underline"
              >
                View all training
              </Link>
            </div>
            <ul className="divide-y divide-gray-100">
              {upcomingTraining.length === 0 ? (
                <li className="py-6 text-center text-sm text-gray-500">
                  No upcoming sessions
                </li>
              ) : (
                upcomingTraining.map((s, idx) => (
                  <li key={`${s.scheduled_at}-${idx}`} className="py-3">
                    <p className="font-medium text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {s.session_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatDate(s.scheduled_at, 'dd MMM yyyy HH:mm')}
                    </p>
                    {s.zoom_link ? (
                      <a
                        href={s.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-green-800 underline"
                      >
                        Join link
                      </a>
                    ) : null}
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
