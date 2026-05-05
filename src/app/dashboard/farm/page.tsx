'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
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

function FarmDashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showWelcome = searchParams.get('welcome') === 'true'
  const welcomeJobId = searchParams.get('job')
  const [welcomeJob, setWelcomeJob] = useState<string | null>(null)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
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
  const [analytics, setAnalytics] = useState<{
    jobs: Array<{
      id: string
      title: string
      status: string
      total_views: number
      views_7d: number
      views_30d: number
      applications: number
    }>
  } | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Array<{ day: string; views: number }>>([])
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    if (!welcomeJobId) return
    void supabase
      .from('jobs')
      .select('title')
      .eq('id', welcomeJobId)
      .single()
      .then(({ data }: { data: { title?: string } | null }) => {
        if (data?.title) setWelcomeJob(data.title)
      })
  }, [welcomeJobId])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/analytics/farm-overview', {
          headers: { Authorization: 'Bearer ' + session.access_token },
        })
        if (res.ok) {
          const data = (await res.json()) as {
            jobs?: Array<{
              id: string
              title: string
              status: string
              total_views: number
              views_7d: number
              views_30d: number
              applications: number
            }>
          }
          setAnalytics({ jobs: data.jobs ?? [] })
        }
      } catch {
        // Non-critical
      }
    }
    void fetchAnalytics()
  }, [])

  useEffect(() => {
    if (!selectedJobId) return
    const fetchChart = async () => {
      setChartLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/job/${selectedJobId}`,
          {
            headers: { 'Authorization': 'Bearer ' + session.access_token },
          }
        )
        if (!res.ok) return
        const json = await res.json() as {
          daily_views?: Array<{ day: string; view_count: number }>
        }
        const filled = fillMissingDays(json.daily_views ?? [])
        setChartData(filled)
      } catch {
        // Non-critical
      } finally {
        setChartLoading(false)
      }
    }
    void fetchChart()
  }, [selectedJobId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (typeof window === 'undefined') return
      const storedToken = sessionStorage.getItem('agth_farm_preview_token')
      const storedJob = sessionStorage.getItem('agth_farm_preview_job')
      if (!storedToken) return
      const session = await getSessionOnce()
      if (cancelled || !session?.access_token) return
      try {
        const res = await fetch('/api/farms/convert-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token: storedToken }),
        })
        if (!res.ok) return
        sessionStorage.removeItem('agth_farm_preview_token')
        sessionStorage.removeItem('agth_farm_preview_job')
        if (storedJob) {
          router.replace(
            '/dashboard/farm?welcome=true&job=' + encodeURIComponent(storedJob)
          )
        }
      } catch {
        /* non-critical */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

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

  function fillMissingDays(
    data: Array<{ day: string; view_count: number }>
  ): Array<{ day: string; views: number }> {
    const result: Array<{ day: string; views: number }> = []
    const map = new Map(data.map((d) => [d.day, d.view_count]))
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      result.push({ day: label, views: map.get(key) ?? 0 })
    }
    return result
  }

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
      {showWelcome && !welcomeDismissed ? (
        <div className='mb-6 flex items-start gap-4 rounded-2xl border border-[#86EFAC] bg-[#F0FDF4] p-5'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E7D32]'>
            <CheckCircle2 className='h-5 w-5 text-white' />
          </div>
          <div className='flex-1'>
            <p className='text-base font-semibold text-[#14532D]'>
              Welcome to AgroTalentHub!
            </p>
            <p className='mt-1 text-sm text-[#166534]'>
              {welcomeJob
                ? `Your job listing "${welcomeJob}" has been linked to your account. You can manage it from your Jobs tab.`
                : 'Your farm account is set up and ready. Start managing your jobs and applications from your dashboard.'}
            </p>
          </div>
          <button
            type='button'
            onClick={() => {
              setWelcomeDismissed(true)
              const url = new URL(window.location.href)
              url.searchParams.delete('welcome')
              url.searchParams.delete('job')
              window.history.replaceState({}, '', url.toString())
            }}
            className='shrink-0 text-[#166534] hover:text-[#14532D]'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      ) : null}
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

      {analytics && analytics.jobs.length > 0 ? (
        <section className='mt-10'>
          <h2
            className='mb-1 text-xl font-bold text-gray-900'
            style={{ fontFamily: 'var(--font-sora, sans-serif)' }}
          >
            Job Performance
          </h2>
          <p className='mb-6 text-sm text-gray-500'>
            Views and applications for your job listings.
          </p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {analytics.jobs.map((job) => {
              const conversionRate =
                job.total_views > 0
                  ? ((job.applications / job.total_views) * 100).toFixed(1)
                  : '0.0'
              return (
                <div
                  key={job.id}
                  onClick={() =>
                    setSelectedJobId(selectedJobId === job.id ? null : job.id)
                  }
                  className={
                    'bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all ' +
                    (selectedJobId === job.id
                      ? 'border-[#2E7D32] ring-2 ring-[#2E7D32]/20'
                      : 'border-gray-100 hover:shadow-md')
                  }
                >
                  <div className='mb-3 flex items-start justify-between gap-2'>
                    <h3 className='line-clamp-2 text-sm font-semibold leading-snug text-gray-900'>
                      {job.title}
                    </h3>
                    <span
                      className={
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ' +
                        (job.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500')
                      }
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <p className='text-2xl font-bold text-gray-900'>
                        {job.total_views}
                      </p>
                      <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                        Views
                      </p>
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-[#2E7D32]'>
                        {job.applications}
                      </p>
                      <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                        Applied
                      </p>
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-gray-900'>
                        {conversionRate}%
                      </p>
                      <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                        Rate
                      </p>
                    </div>
                  </div>
                  <div className='mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400'>
                    <span>{job.views_7d} views this week</span>
                    <Link
                      href={'/dashboard/farm/jobs/' + job.id}
                      className='font-semibold text-[#2E7D32] hover:underline'
                      onClick={(e) => e.stopPropagation()}
                    >
                      Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedJobId && (
            <div className='mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h3
                    className='text-base font-semibold text-gray-900'
                    style={{ fontFamily: 'var(--font-sora, sans-serif)' }}
                  >
                    {analytics?.jobs.find((j) => j.id === selectedJobId)?.title ??
                      'Job'}
                  </h3>
                  <p className='mt-0.5 text-xs text-gray-400'>
                    Views over the last 30 days
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedJobId(null)}
                  className='text-sm text-gray-400 hover:text-gray-600'
                >
                  Close
                </button>
              </div>

              {chartLoading ? (
                <div className='flex h-48 items-center justify-center'>
                  <div className='h-6 w-6 animate-spin rounded-full border-2 border-[#2E7D32] border-t-transparent' />
                </div>
              ) : (
                <ResponsiveContainer width='100%' height={200}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id='viewsGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#2E7D32' stopOpacity={0.2} />
                        <stop offset='95%' stopColor='#2E7D32' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis
                      dataKey='day'
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      interval={6}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [
                        typeof value === 'number' ? value : Number(value ?? 0),
                        'Views',
                      ]}
                    />
                    <Area
                      type='monotone'
                      dataKey='views'
                      stroke='#2E7D32'
                      strokeWidth={2}
                      fill='url(#viewsGradient)'
                      dot={false}
                      activeDot={{ r: 4, fill: '#2E7D32' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              <div className='mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4'>
                {(() => {
                  const job = analytics?.jobs.find((j) => j.id === selectedJobId)
                  if (!job) return null
                  return (
                    <>
                      <div>
                        <p className='text-lg font-bold text-gray-900'>
                          {job.views_7d}
                        </p>
                        <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                          This week
                        </p>
                      </div>
                      <div>
                        <p className='text-lg font-bold text-gray-900'>
                          {job.views_30d}
                        </p>
                        <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                          This month
                        </p>
                      </div>
                      <div>
                        <p className='text-lg font-bold text-[#2E7D32]'>
                          {job.applications}
                        </p>
                        <p className='text-[11px] uppercase tracking-wide text-gray-500'>
                          Applied
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}

export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <FarmDashboardPageContent />
    </Suspense>
  )
}
