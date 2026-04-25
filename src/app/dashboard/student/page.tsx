'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatDate, timeAgo } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card, HeroCard, ProgressCard, StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

const supabase = createSupabaseClient()

function firstName(full: string | null | undefined) {
  if (!full?.trim()) return 'there'
  return full.trim().split(/\s+/)[0] ?? 'there'
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
  status?: string
  expires_at: string | null
  created_at?: string
}

type SessionRow = {
  id?: string
  title: string
  session_type: string
  scheduled_at: string
  zoom_link: string | null
  trainer_name?: string | null
  duration_minutes?: number | null
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
    shortlisted: 0,
    unreadNotices: 0,
  })
  const [recentApps, setRecentApps] = useState<JobRow[]>([])
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
        shortlistedR,
        tpRes,
        appsListRes,
        tpListRes,
        unreadNoticesR,
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
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('applicant_id', uid)
          .eq('status', 'shortlisted'),
        supabase
          .from('training_participants')
          .select('id', { count: 'exact', head: true })
          .eq('participant_id', uid),
        supabase
          .from('applications')
          .select('id, created_at, status, jobs(title, location)')
          .eq('applicant_id', uid)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('training_participants')
          .select(
            `
            id,
            training_sessions ( id, title, session_type, scheduled_at, zoom_link, trainer_name, duration_minutes )
          `
          )
          .eq('participant_id', uid),
        supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .or('audience.eq.all,audience.eq.student'),
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
        shortlisted: shortlistedR.count ?? 0,
        unreadNotices: unreadNoticesR.count ?? 0,
      })

      setRecentApps(
        (((appsListRes.data as any[] | null) ?? []).map((a) => ({
          id: a.id,
          created_at: a.created_at,
          status: a.status,
          title: a.jobs?.title ?? 'Job',
          location: a.jobs?.location ?? '-',
          expires_at: null,
        })) as JobRow[])
      )
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
  const subtitle = `${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${profile?.institution_name ?? profile?.preferred_region ?? 'Ghana'}`
  const nss = profile?.nss_status ?? 'Not Set'
  const progressItems = [
    { label: 'Institution', value: 100, status: profile?.institution_name ? 'done' : 'missing' },
    { label: 'Region', value: 100, status: profile?.preferred_region ? 'done' : 'missing' },
    { label: 'NSS Status', value: profile?.nss_status && profile?.nss_status !== 'not_applicable' ? 100 : 60, status: profile?.nss_status && profile?.nss_status !== 'not_applicable' ? 'done' : 'partial' },
    { label: 'Documents', value: profile?.cv_url || profile?.certificate_url ? 100 : 20, status: profile?.cv_url || profile?.certificate_url ? 'done' : 'missing' },
  ] as { label: string; value: number; status: 'done' | 'partial' | 'missing' }[]

  return (
    <div className='p-4 md:p-6'>
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

        <DashboardPageHeader greeting={`Welcome back, ${welcome}`} subtitle={subtitle} />

        {profile && !profile.is_verified ? (
          <div className='mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 backdrop-blur-sm'>
            <AlertTriangle className='mt-0.5 h-5 w-5 text-amber-500' />
            <div>
              <p className='text-sm font-semibold text-amber-800'>Account Pending Verification</p>
              <p className='mt-0.5 text-xs text-amber-600'>Your student account is under review. You cannot access some actions until verified.</p>
            </div>
          </div>
        ) : null}

        <div className='mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <HeroCard
            className='lg:col-span-2'
            backgroundImage='/Learners_agric.jpg'
            title='Student Overview'
            gradientFrom='#0D3320'
            gradientTo='#1A6B3C'
            stats={[
              { label: 'Applications', value: stats.myApplications },
              { label: 'Shortlisted', value: stats.shortlisted },
              { label: 'Training Sessions', value: stats.trainingSessions },
              { label: 'NSS Status', value: nss },
            ]}
          />
          <ProgressCard className='lg:col-span-1' title='Profile Completion' items={progressItems} />
        </div>

        <div className='mb-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
          <StatCard
            label='Available Jobs'
            value={stats.availableJobs}
            iconBg='bg-brand/10'
            icon={<Briefcase className='h-4 w-4 text-brand' />}
          />
          <StatCard
            label='Applications'
            value={stats.myApplications}
            iconBg='bg-gold/10'
            icon={<FileText className='h-4 w-4 text-gold' />}
          />
          <StatCard
            label='Training'
            value={stats.trainingSessions}
            iconBg='bg-blue-50'
            icon={<GraduationCap className='h-4 w-4 text-blue-600' />}
          />
          <StatCard
            label='Notices'
            value={stats.unreadNotices}
            iconBg='bg-purple-50'
            icon={<Bell className='h-4 w-4 text-purple-600' />}
          />
        </div>

        <div className='-mx-1 mb-4 flex gap-3 overflow-x-auto px-1 scrollbar-hide'>
          {['/image_interns.jpg', '/Learners_agric.jpg', '/Womanmobile.webp'].map((src, i) => (
            <div key={i} className='relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-xl'>
              <Image src={src} alt='' fill className='object-cover' sizes='144px' />
              <div className='absolute inset-0 bg-forest/20' />
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <Card>
            <div className='-mx-5 -mt-5 mb-3 flex items-center justify-between rounded-t-2xl border-b border-gray-50 bg-gray-50/80 px-5 pb-3 pt-4 backdrop-blur-sm'>
              <h2 className='text-base font-semibold text-gray-900'>Recent Applications</h2>
              <Link
                href='/dashboard/student/applications'
                className='text-xs font-semibold text-brand'
              >
                View all
              </Link>
            </div>
            {recentApps.length === 0 ? (
              <div className='py-6 text-center'>
                <EmptyState icon={<GraduationCap className='mx-auto h-10 w-10 text-gray-400' />} title='No applications yet' />
                <Link href='/dashboard/student/jobs' className='mt-3 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white'>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              recentApps.map((a) => (
                <div key={a.id} className='flex items-center justify-between border-b border-gray-50 py-3 last:border-0'>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{a.title}</p>
                    <p className='text-xs text-gray-400'>{a.location}</p>
                  </div>
                  <div className='text-right'>
                    <StatusBadge status={a.status ?? 'pending'} />
                    <p className='mt-1 text-xs text-gray-400'>{a.created_at ? timeAgo(a.created_at) : '-'}</p>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <div className='-mx-5 -mt-5 mb-3 flex items-center justify-between rounded-t-2xl border-b border-gray-50 bg-gray-50/80 px-5 pb-3 pt-4 backdrop-blur-sm'>
              <h2 className='text-base font-semibold text-gray-900'>Upcoming Training</h2>
              <Link
                href='/dashboard/student/training'
                className='text-xs font-semibold text-brand'
              >
                View all
              </Link>
            </div>
            {upcomingTraining.length === 0 ? (
              <p className='py-8 text-center text-sm text-gray-500'>No upcoming sessions</p>
            ) : (
              upcomingTraining.map((s, idx) => (
                <div key={`${s.scheduled_at}-${idx}`} className='flex items-center gap-3 border-b border-gray-50 py-3 last:border-0'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50'>
                    <GraduationCap className='h-4 w-4 text-blue-600' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900'>{s.title}</p>
                    <p className='text-xs text-gray-400'>
                      {(s.trainer_name ?? 'Trainer')} · {s.duration_minutes ?? 0} mins
                    </p>
                    <p className='mt-1 flex items-center gap-1 text-xs font-medium text-brand'>
                      <Calendar className='h-3 w-3' />
                      {formatDate(s.scheduled_at)}
                    </p>
                  </div>
                  {s.zoom_link ? (
                    <span className='rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700'>Join</span>
                  ) : null}
                </div>
              ))
            )}
          </Card>
        </div>
    </div>
  )
}
