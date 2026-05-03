'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Briefcase, ChevronRight, CreditCard, UserCheck, Users } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getSessionOnce } from '@/lib/get-session-once'
import type { Profile } from '@/types'
import { timeAgo } from '@/lib/utils'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card, HeroCard, ProgressCard, StatCard } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

function farmDisplayName(profile: Profile | null) {
  return profile?.farm_name?.trim() || profile?.full_name?.trim() || 'there'
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() ?? '')
    .join('')
}

function DashboardSkeleton() {
  return (
    <div className='space-y-4 p-6'>
      <div className='h-10 w-64 animate-pulse rounded-xl bg-gray-200' />
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className='h-24 animate-pulse rounded-2xl bg-gray-200' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div className='h-72 animate-pulse rounded-2xl bg-gray-200' />
        <div className='h-72 animate-pulse rounded-2xl bg-gray-200' />
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
    monthApplications: 0,
    pendingPayments: 0,
  })
  const [recentApps, setRecentApps] = useState<FarmAppRow[]>([])
  const [activeJobRows, setActiveJobRows] = useState<FarmJobRow[]>([])
  const [hasPostedJob, setHasPostedJob] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const session = await getSessionOnce()
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
      const jobIds = (jobRows ?? []).map((j: { id: string }) => j.id)

      const [
        activeJobsR,
        jobsPostedR,
        totalAppsR,
        pendingAppsR,
        placeR,
        monthAppsR,
        pendingPaymentsR,
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
        jobIds.length
          ? supabase
              .from('applications')
              .select('id', { count: 'exact', head: true })
              .in('job_id', jobIds)
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          : Promise.resolve({ count: 0, error: null }),
        supabase
          .from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('farm_id', farmId)
          .eq('recruitment_fee_paid', false),
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
        monthApplications: monthAppsR.count ?? 0,
        pendingPayments: pendingPaymentsR.count ?? 0,
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

  const farmName = farmDisplayName(profile)
  const subtitle = `${new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}${profile?.farm_location ? ` · ${profile.farm_location}` : ''}`

  const profileItems: { label: string; value: number; status: 'done' | 'partial' | 'missing' }[] = [
    { label: 'Farm name', value: 100, status: profile?.farm_name ? 'done' : 'missing' },
    { label: 'Farm type', value: 100, status: profile?.farm_type ? 'done' : 'missing' },
    { label: 'Location', value: 100, status: profile?.farm_location ? 'done' : 'missing' },
    { label: 'Address', value: 100, status: profile?.farm_address ? 'done' : 'missing' },
    { label: 'Phone', value: 100, status: profile?.phone ? 'done' : 'missing' },
    { label: 'Verified', value: 100, status: profile?.is_verified ? 'done' : 'missing' },
  ]

  return (
    <div className='p-4 md:p-6'>
      {profile ? <OnboardingChecklist profile={profile} hasPostedJob={hasPostedJob} /> : null}

      <DashboardPageHeader greeting={`Welcome back, ${farmName}`} subtitle={subtitle} />

      <div className='mb-4 flex items-center justify-end'>
        <Pill variant='gray'>Pending review: {stats.pendingReview}</Pill>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <HeroCard
          className='lg:col-span-2'
          backgroundImage='/farm_image_header.webp'
          title='Farm Overview'
          gradientFrom='#0D3320'
          gradientTo='#1A6B3C'
          stats={[
            { label: 'Active Jobs', value: stats.activeJobs },
            { label: 'Total Applications', value: stats.totalApps },
            { label: 'Active Placements', value: stats.activePlacements },
            { label: 'This Month', value: stats.monthApplications },
          ]}
        />
        <ProgressCard className='lg:col-span-1' title='Farm Profile' items={profileItems} />
      </div>

      {profile && !profile.is_verified ? (
        <div className='mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 backdrop-blur-sm'>
          <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500' aria-hidden />
          <div>
            <p className='text-sm font-semibold text-amber-800'>Account Pending Verification</p>
            <p className='mt-0.5 text-xs text-amber-600'>
              Your farm account is under review. You cannot post jobs until verified.
            </p>
          </div>
        </div>
      ) : null}

      <div className='mb-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
        <StatCard label='Active Jobs' value={stats.activeJobs} iconBg='bg-brand/10' icon={<Briefcase className='h-4 w-4 text-brand' />} />
        <StatCard label='Applications' value={stats.totalApps} iconBg='bg-gold/10' icon={<Users className='h-4 w-4 text-gold' />} />
        <StatCard label='Placements' value={stats.activePlacements} iconBg='bg-purple-50' icon={<UserCheck className='h-4 w-4 text-purple-600' />} />
        <StatCard label='Pending Payments' value={stats.pendingPayments} iconBg='bg-red-50' icon={<CreditCard className='h-4 w-4 text-red-500' />} />
      </div>

      <div className='-mx-1 mb-4 flex gap-3 overflow-x-auto px-1 scrollbar-hide'>
        {['/greenhouse2.jpg', '/plantainfarm.jpg', '/Learners_agric.jpg'].map((src, i) => (
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
            <Link href='/dashboard/farm/applications' className='text-xs font-semibold text-brand transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
              View all
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className='py-8 text-center text-sm text-gray-500'>No applications yet.</p>
          ) : (
            recentApps.map((a) => {
              const score = Math.max(0, Math.min(100, Number(a.match_score ?? 0)))
              const applicantName = a.applicant?.full_name ?? 'Applicant'
              return (
                <div key={a.id} className='flex items-center gap-3 border-b border-gray-50 py-3 last:border-0'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand'>
                    {initials(applicantName)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900'>{applicantName}</p>
                    <p className='text-xs text-gray-400'>
                      {a.jobs?.title ?? 'Job'}
                      <span className='ml-1 rounded-full bg-gold/10 px-1.5 py-0.5 text-[10px] font-semibold text-gold'>{score}%</span>
                    </p>
                    <div className='mt-1.5 h-1.5 w-full rounded-full bg-gray-100'>
                      <div className='h-1.5 rounded-full' style={{ width: `${score}%`, backgroundImage: 'linear-gradient(90deg,#1A6B3C,#C8963E)' }} />
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
            <h2 className='text-base font-semibold text-gray-900'>My Jobs</h2>
            <Link href='/dashboard/farm/jobs/new' className='text-xs font-semibold text-brand transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
              Post New Job
            </Link>
          </div>
          {activeJobRows.length === 0 ? (
            <p className='py-8 text-center text-sm text-gray-500'>No active jobs yet.</p>
          ) : (
            activeJobRows.map((j) => (
              <Link key={j.id} href={`/dashboard/farm/jobs/${j.id}`} className='flex items-center gap-3 border-b border-gray-50 py-3 transition-colors hover:bg-gray-50/70 last:border-0'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10'>
                  <Briefcase className='h-4 w-4 text-brand' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-gray-900'>{j.title}</p>
                  <div className='mt-0.5 flex items-center gap-2'>
                    <p className='truncate text-xs text-gray-400'>{j.location}</p>
                    <Pill variant='gray'>{j.job_type}</Pill>
                  </div>
                  <p className='mt-0.5 text-xs text-gray-400'>{j.application_count ?? 0} applications</p>
                </div>
                <div className='flex items-center gap-2'>
                  <StatusBadge status={j.status} />
                  <ChevronRight className='h-4 w-4 text-gray-300' />
                </div>
              </Link>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
