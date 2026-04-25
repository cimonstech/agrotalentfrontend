'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Briefcase, MapPin, Users } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type FarmJob = {
  id: string
  title: string
  location: string
  status: 'active' | 'draft' | 'closed' | 'paused'
  job_type: string
  application_count: number | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  expires_at: string | null
  created_at: string
  hidden_at: string | null
  deleted_at: string | null
  reactivated_at: string | null
}

type Tab = 'all' | 'active' | 'draft' | 'closed' | 'paused' | 'deleted'

export default function FarmJobsPage() {
  const [jobs, setJobs] = useState<FarmJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  const getDaysPosted = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))

  async function loadJobs(currentTab: Tab) {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setJobs([])
      setLoading(false)
      return
    }
    let query = supabase
      .from('jobs')
      .select(
        'id, title, location, status, job_type, application_count, salary_min, salary_max, salary_currency, expires_at, created_at, hidden_at, deleted_at, reactivated_at'
      )
      .eq('farm_id', uid)
      .order('created_at', { ascending: false })

    if (currentTab === 'deleted') {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
      if (currentTab !== 'all') {
        query = query.eq('status', currentTab)
      }
    }
    const { data } = await query
    setJobs((data as FarmJob[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadJobs(tab)
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [tab])

  const counts = useMemo(
    () => ({
      all: jobs.length,
      active: jobs.filter((j) => j.status === 'active').length,
      draft: jobs.filter((j) => j.status === 'draft').length,
      closed: jobs.filter((j) => j.status === 'closed').length,
      paused: jobs.filter((j) => j.status === 'paused').length,
      deleted: jobs.filter((j) => j.deleted_at != null).length,
    }),
    [jobs]
  )

  const filtered = useMemo(() => {
    if (tab === 'all') return jobs
    if (tab === 'deleted') return jobs.filter((j) => j.deleted_at != null)
    return jobs.filter((j) => j.status === tab)
  }, [jobs, tab])

  const handleReactivate = async (jobId: string) => {
    const newExpiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString()
    await supabase
      .from('jobs')
      .update({
        hidden_at: null,
        status: 'active',
        reactivated_at: new Date().toISOString(),
        expires_at: newExpiry,
      })
      .eq('id', jobId)
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, hidden_at: null, status: 'active', expires_at: newExpiry }
          : job
      )
    )
  }

  const tabClass = (active: boolean) =>
    active
      ? 'rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm'
      : 'rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700'

  return (
    <div className='p-4 md:p-6'>
      <DashboardPageHeader
        greeting='My Jobs'
        subtitle={`${filtered.length} job listings`}
        actions={
          <Link href='/dashboard/farm/jobs/new' className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
            Post New Job
          </Link>
        }
      />

      <div className='mb-4 inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
        <button type='button' className={tabClass(tab === 'all')} onClick={() => setTab('all')}>
          All <span className='ml-1.5 text-[10px]'>{counts.all}</span>
        </button>
        <button type='button' className={tabClass(tab === 'active')} onClick={() => setTab('active')}>
          Active <span className='ml-1.5 text-[10px]'>{counts.active}</span>
        </button>
        <button type='button' className={tabClass(tab === 'draft')} onClick={() => setTab('draft')}>
          Draft <span className='ml-1.5 text-[10px]'>{counts.draft}</span>
        </button>
        <button type='button' className={tabClass(tab === 'closed')} onClick={() => setTab('closed')}>
          Closed <span className='ml-1.5 text-[10px]'>{counts.closed}</span>
        </button>
        <button type='button' className={tabClass(tab === 'paused')} onClick={() => setTab('paused')}>
          Paused <span className='ml-1.5 text-[10px]'>{counts.paused}</span>
        </button>
        <button type='button' className={tabClass(tab === 'deleted')} onClick={() => setTab('deleted')}>
          Deleted <span className='ml-1.5 text-[10px]'>{counts.deleted}</span>
        </button>
      </div>

      {loading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {[0, 1, 2, 3].map((k) => (
            <Card key={k} className='h-56 animate-pulse'>
              <div />
            </Card>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {filtered.map((job, index) => {
            const daysPosted = getDaysPosted(job.created_at)
            const isHidden = !!job.hidden_at
            const isNearExpiry = daysPosted >= 50 && daysPosted < 60 && !job.deleted_at
            const imageSrc =
              index % 3 === 0 ? '/greenhouse2.jpg' : index % 3 === 1 ? '/plantainfarm.jpg' : '/Agribusiness.jpg'
            return (
              <div
                key={job.id}
                className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/5'
              >
                <div className='relative h-20'>
                  <Image src={imageSrc} alt='' fill className='object-cover object-center' sizes='300px' />
                  <div className='absolute inset-0 bg-gradient-to-b from-forest/50 to-forest/80' />
                  <div className='absolute left-3 top-3'>
                    <Pill className='border-white/20 bg-white/20 text-white backdrop-blur-sm'>{job.job_type}</Pill>
                  </div>
                  <div className='absolute right-3 top-3'>
                    <span className='inline-flex rounded-lg border border-white/20 bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
                      {job.status}
                    </span>
                  </div>
                </div>
                <div className='p-4'>
                  <p className='font-bold text-gray-900'>{job.title}</p>
                  <p className='mt-1 flex items-center gap-1 text-xs text-gray-400'>
                    <MapPin className='h-3 w-3' />
                    {job.location}
                  </p>
                  <p className='mt-2 flex items-center gap-2 text-xs text-gray-500'>
                    <Users className='h-3 w-3 text-gray-400' />
                    {job.application_count ?? 0} applications
                  </p>
                  {job.salary_min != null || job.salary_max != null ? (
                    <p className='mt-1 text-sm font-semibold text-brand'>
                      {formatCurrency(job.salary_min, job.salary_currency ?? 'GHS')}
                      {job.salary_max != null ? ` - ${formatCurrency(job.salary_max, job.salary_currency ?? 'GHS')}` : ''}
                    </p>
                  ) : null}
                  <p className='mt-1 text-xs text-gray-400'>Expires {formatDate(job.expires_at)}</p>
                  {isHidden ? (
                    <span className='mt-2 inline-flex rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600'>
                      Hidden, tap to reactivate
                    </span>
                  ) : null}
                  {isNearExpiry ? (
                    <span className='mt-2 inline-flex rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700'>
                      Expires in {60 - daysPosted} days
                    </span>
                  ) : null}
                  {job.deleted_at ? (
                    <p className='mt-2 text-xs text-gray-400'>
                      This job was automatically removed after 60 days
                    </p>
                  ) : null}
                  <div className='mt-3 border-t border-gray-50 pt-3'>
                    <div className='flex gap-2'>
                      <Link href={`/dashboard/farm/jobs/${job.id}/applications`} className='rounded-lg bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
                        View Applications
                      </Link>
                      <Link href={`/dashboard/farm/jobs/${job.id}`} className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'>
                        Edit
                      </Link>
                      <Link href={`/dashboard/farm/jobs/${job.id}`} className='rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200'>
                        Close
                      </Link>
                      {isHidden ? (
                        <button
                          type='button'
                          onClick={() => void handleReactivate(job.id)}
                          className='rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700'
                        >
                          Reactivate
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && filtered.length === 0 ? (
        <Card className='mt-4'>
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <Briefcase className='h-4 w-4' />
            No jobs in this view.
          </div>
        </Card>
      ) : null}
    </div>
  )
}
