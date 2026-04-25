'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Briefcase, FileText, GraduationCap, Megaphone, Users } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatSalaryRange, timeAgo } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card, HeroCard, ProgressCard, StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import type { ProgressCardItem } from '@/components/ui/Card'

const supabase = createSupabaseClient()

function firstName(full: string | null | undefined) {
  if (!full?.trim()) return 'there'
  return full.trim().split(/\s+/)[0] ?? 'there'
}

type AppRow = {
  id: string
  status: string
  created_at: string
  match_score: number
  jobs: { title: string; location: string } | null
}

type JobRow = {
  id: string
  title: string
  location: string
  match_score?: number
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
    shortlistedApps: 0,
    activePlacements: 0,
    activeJobsCount: 0,
    trainingSessions: 0,
  })
  const [recentApps, setRecentApps] = useState<AppRow[]>([])
  const [matchedJobs, setMatchedJobs] = useState<JobRow[]>([])
  const [unreadNotice, setUnreadNotice] = useState<{ id: string; title: string } | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [hasCvDocument, setHasCvDocument] = useState(false)
  const [hasCertificateDocument, setHasCertificateDocument] = useState(false)

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

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      if (cancelled) return
      setProfile(prof as Profile | null)

      const [totalR, pendR, shortR, placeR, appsRes, matchesRes, noticesRes, readsRes, docsRes, jobsRes, trainRes] =
        await Promise.all([
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', uid),
          supabase
            .from('applications')
            .select('id', { count: 'exact', head: true })
            .eq('applicant_id', uid)
            .eq('status', 'pending'),
          supabase
            .from('applications')
            .select('id', { count: 'exact', head: true })
            .eq('applicant_id', uid)
            .eq('status', 'shortlisted'),
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
              match_score,
              jobs ( title, location )
            `
            )
            .eq('applicant_id', uid)
            .order('created_at', { ascending: false })
            .limit(5),
          fetch('/api/matches?all_regions=true', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).then((r) => r.json().catch(() => ({ matches: [] }))),
          supabase
            .from('notices')
            .select('id, title, created_at')
            .or('audience.eq.all,audience.eq.graduate')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase.from('notice_reads').select('notice_id').eq('user_id', uid),
          supabase.from('documents').select('document_type').eq('user_id', uid),
          supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('training_participants').select('id', { count: 'exact', head: true }).eq('participant_id', uid),
        ])

      if (cancelled) return

      const docRows = docsRes.data as { document_type: string }[] | null
      const types = new Set((docRows ?? []).map((d) => d.document_type))
      setHasCvDocument(types.has('cv'))
      setHasCertificateDocument(types.has('certificate'))

      setStats({
        totalApps: totalR.count ?? 0,
        pendingApps: pendR.count ?? 0,
        shortlistedApps: shortR.count ?? 0,
        activePlacements: placeR.count ?? 0,
        activeJobsCount: jobsRes.count ?? 0,
        trainingSessions: trainRes.count ?? 0,
      })
      setHasApplied((totalR.count ?? 0) > 0)
      setRecentApps((appsRes.data as AppRow[] | null) ?? [])

      type MatchApiRow = {
        match_score: number
        job: {
          id: string
          title: string
          location: string
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          farm_id: string
          profiles: { farm_name: string | null } | { farm_name: string | null }[] | null
        } | null
      }

      const jrows = ((matchesRes?.matches ?? []) as MatchApiRow[])
        .map((m) => {
          if (!m.job) return null
          const profileRel = Array.isArray(m.job.profiles) ? (m.job.profiles[0] ?? null) : m.job.profiles
          return { ...m.job, match_score: m.match_score, profiles: profileRel } as JobRow
        })
        .filter((row): row is JobRow => row !== null)
        .slice(0, 4)
      setMatchedJobs(jrows)

      const readIds = new Set((readsRes.data ?? []).map((r: { notice_id: string }) => r.notice_id))
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
    return (
      <div className='space-y-4 p-6'>
        <div className='h-10 w-64 animate-pulse rounded-xl bg-gray-200' />
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <div className='h-44 animate-pulse rounded-2xl bg-gray-200 lg:col-span-2' />
          <div className='h-44 animate-pulse rounded-2xl bg-gray-200' />
        </div>
      </div>
    )
  }

  const welcome = firstName(profile?.full_name)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const subtitle = `${today}${profile?.preferred_region ? `, ${profile.preferred_region}` : ''}`
  const topMatchScore = matchedJobs.reduce((best, j) => Math.max(best, j.match_score ?? 0), 0)

  const progressItems: ProgressCardItem[] = [
    { label: 'CV', value: 100, status: profile?.cv_url || hasCvDocument ? 'done' : 'missing' },
    {
      label: 'Certificate',
      value: 100,
      status: profile?.certificate_url || hasCertificateDocument ? 'done' : 'missing',
    },
    { label: 'Institution', value: 100, status: profile?.institution_name ? 'done' : 'missing' },
    { label: 'Region', value: 100, status: profile?.preferred_region ? 'done' : 'missing' },
    {
      label: 'Specialization',
      value: profile?.specialization ? 70 : 10,
      status: profile?.specialization ? (profile?.qualification ? 'done' : 'partial') : 'missing',
    },
  ]

  return (
    <div className='p-6'>
      {profile ? (
        <OnboardingChecklist
          profile={profile}
          hasApplied={hasApplied}
          hasCvDocument={hasCvDocument}
          hasCertificateDocument={hasCertificateDocument}
        />
      ) : null}

      <DashboardPageHeader greeting={`Welcome back, ${welcome}`} subtitle={subtitle} />

      {unreadNotice ? (
        <div className='mb-4 flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/10 p-4'>
          <Megaphone className='h-5 w-5 flex-shrink-0 text-gold' aria-hidden />
          <div>
            <p className='text-sm font-semibold text-gray-900'>{unreadNotice.title}</p>
            <Link href='/dashboard/graduate/notices' className='mt-1 inline-block text-xs font-semibold text-brand'>
              Read notice
            </Link>
          </div>
        </div>
      ) : null}

      <div className='mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <HeroCard
          className='lg:col-span-2'
          backgroundImage='/farm_image_header.webp'
          title='Your Activity'
          gradientFrom='#0D3320'
          gradientTo='#1A6B3C'
          stats={[
            { label: 'Applications', value: stats.totalApps },
            { label: 'Shortlisted', value: stats.shortlistedApps },
            { label: 'Placements', value: stats.activePlacements },
            { label: 'Top Match', value: `${topMatchScore}%` },
          ]}
        />
        <ProgressCard className='lg:col-span-1' title='Profile Completion' items={progressItems} />
      </div>

      <div className='mb-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
        <StatCard
          label='Jobs Available'
          value={stats.activeJobsCount}
          icon={<Briefcase className='h-4 w-4 text-brand' />}
          iconBg='bg-brand/10'
        />
        <StatCard
          label='Applications'
          value={stats.totalApps}
          icon={<FileText className='h-4 w-4 text-gold' />}
          iconBg='bg-gold/10'
        />
        <StatCard
          label='Training'
          value={stats.trainingSessions}
          icon={<GraduationCap className='h-4 w-4 text-blue-600' />}
          iconBg='bg-blue-50'
        />
        <StatCard
          label='Placements'
          value={stats.activePlacements}
          icon={<Users className='h-4 w-4 text-purple-600' />}
          iconBg='bg-purple-50'
        />
      </div>

      <div className='-mx-1 mb-4 flex gap-3 overflow-x-auto px-1 scrollbar-hide'>
        {['/greenhouse2.jpg', '/plantainfarm.jpg', '/Womanmobile.webp'].map((src, i) => (
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
            <Link href='/dashboard/graduate/applications' className='text-xs font-semibold text-brand'>
              View all
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className='py-8 text-center text-sm text-gray-500'>No applications yet.</p>
          ) : (
            recentApps.map((a) => {
              const score = Math.max(0, Math.min(100, Number(a.match_score ?? 0)))
              const title = a.jobs?.title ?? 'Job'
              return (
                <div key={a.id} className='flex items-center gap-3 border-b border-gray-50 py-3 last:border-0'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand'>
                    {title.slice(0, 1).toUpperCase()}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900'>{title}</p>
                    <p className='text-xs text-gray-400'>{a.jobs?.location ?? '-'}</p>
                    <div className='mt-1.5 h-1.5 w-full rounded-full bg-gray-100'>
                      <div
                        className='h-1.5 rounded-full'
                        style={{
                          width: `${score}%`,
                          backgroundImage: 'linear-gradient(90deg,#1A6B3C,#C8963E)',
                        }}
                      />
                    </div>
                  </div>
                  <div className='text-right'>
                    <StatusBadge status={a.status} />
                    <p className='mt-1 text-xs text-gray-400'>{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              )
            })
          )}
        </Card>

        <Card>
          <div className='-mx-5 -mt-5 mb-3 flex items-center justify-between rounded-t-2xl border-b border-gray-50 bg-gray-50/80 px-5 pb-3 pt-4 backdrop-blur-sm'>
            <h2 className='text-base font-semibold text-gray-900'>Matched Jobs</h2>
            <Link href='/dashboard/graduate/jobs' className='text-xs font-semibold text-brand'>
              Browse all
            </Link>
          </div>
          {matchedJobs.length === 0 ? (
            <p className='py-8 text-center text-sm text-gray-500'>No matched jobs right now.</p>
          ) : (
            matchedJobs.map((j, idx) => {
              const score = j.match_score ?? 0
              const circleClass =
                idx % 3 === 0 ? 'bg-brand/10' : idx % 3 === 1 ? 'bg-gold/10' : 'bg-blue-50'
              const scoreClass =
                score >= 80
                  ? 'bg-brand/10 text-brand'
                  : score >= 60
                    ? 'bg-gold/10 text-gold'
                    : 'bg-blue-50 text-blue-600'
              return (
                <Link key={j.id} href={`/dashboard/graduate/jobs/${j.id}`} className='flex items-center gap-3 border-b border-gray-50 py-3 last:border-0'>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm ${circleClass}`}>🌿</div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900'>{j.title}</p>
                    <p className='text-xs text-gray-400'>
                      {j.profiles?.farm_name ?? 'Farm'} · {j.location}
                    </p>
                    <p className='mt-0.5 text-xs font-semibold text-brand'>
                      {formatSalaryRange(j.salary_min, j.salary_max, j.salary_currency ?? 'GHS')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreClass}`}>{score}%</span>
                </Link>
              )
            })
          )}
        </Card>
      </div>
    </div>
  )
}
