'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  RefreshCw,
  Send,
  Users,
  XCircle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Job } from '@/types'

const supabase = createSupabaseClient()

type PipelineTab = 'unvetted' | 'vetted' | 'live' | 'report_sent' | 'converted'

const TABS: { key: PipelineTab; label: string }[] = [
  { key: 'unvetted', label: 'Unvetted' },
  { key: 'vetted', label: 'Vetted' },
  { key: 'live', label: 'Live' },
  { key: 'report_sent', label: 'Report Sent' },
  { key: 'converted', label: 'Converted' },
]

type SendPreviewResponse = {
  success?: boolean
  error?: string
  preview_url?: string
  total_applicants?: number
}

export default function SourcedJobsPipelinePage() {
  const [activeTab, setActiveTab] = useState<PipelineTab>('unvetted')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<PipelineTab, number>>({
    unvetted: 0,
    vetted: 0,
    live: 0,
    report_sent: 0,
    converted: 0,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [vettingNotes, setVettingNotes] = useState<Record<string, string>>({})
  const [deadlines, setDeadlines] = useState<Record<string, string>>({})
  const [showNotesFor, setShowNotesFor] = useState<string | null>(null)
  const [sendingReport, setSendingReport] = useState<string | null>(null)
  const [reportResult, setReportResult] = useState<Record<string, string>>({})
  const [copiedJob, setCopiedJob] = useState<string | null>(null)

  const loadCounts = useCallback(async () => {
    const tabs: PipelineTab[] = [
      'unvetted',
      'vetted',
      'live',
      'report_sent',
      'converted',
    ]
    const newCounts: Record<PipelineTab, number> = {
      unvetted: 0,
      vetted: 0,
      live: 0,
      report_sent: 0,
      converted: 0,
    }

    for (const tab of tabs) {
      let query = supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('is_sourced_job', true)
        .is('deleted_at', null)

      if (tab === 'unvetted') {
        query = query.eq('vetting_status', 'unvetted')
      } else if (tab === 'vetted') {
        query = query.eq('vetting_status', 'vetted').eq('status', 'paused')
      } else if (tab === 'live') {
        query = query
          .eq('vetting_status', 'vetted')
          .eq('status', 'active')
          .is('report_sent_at', null)
      } else if (tab === 'report_sent') {
        query = query.not('report_sent_at', 'is', null)
      } else if (tab === 'converted') {
        query = query.not('assigned_farm_id', 'is', null)
      }

      const { count } = await query
      newCounts[tab] = count ?? 0
    }
    setCounts(newCounts)
  }, [])

  const loadJobs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*, profiles!jobs_farm_id_fkey(farm_name, full_name)')
      .eq('is_sourced_job', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (activeTab === 'unvetted') {
      query = query.eq('vetting_status', 'unvetted')
    } else if (activeTab === 'vetted') {
      query = query.eq('vetting_status', 'vetted').eq('status', 'paused')
    } else if (activeTab === 'live') {
      query = query
        .eq('vetting_status', 'vetted')
        .eq('status', 'active')
        .is('report_sent_at', null)
    } else if (activeTab === 'report_sent') {
      query = query.not('report_sent_at', 'is', null)
    } else if (activeTab === 'converted') {
      query = query.not('assigned_farm_id', 'is', null)
    }

    const { data } = await query
    setJobs((data as Job[]) ?? [])
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    void loadJobs()
    void loadCounts()
  }, [loadJobs, loadCounts])

  const handleApprove = async (job: Job) => {
    setActionLoading(job.id)
    const notes = vettingNotes[job.id] ?? ''
    const deadline = deadlines[job.id] ?? null
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('jobs')
      .update({
        vetting_status: 'vetted',
        status: 'active',
        vetted_at: new Date().toISOString(),
        vetted_by: user?.id ?? null,
        vetting_notes: notes || null,
        application_deadline: deadline
          ? new Date(deadline).toISOString()
          : null,
      })
      .eq('id', job.id)

    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      void loadCounts()
    }
    setActionLoading(null)
    setShowNotesFor(null)
  }

  const handleReject = async (job: Job) => {
    if (
      !window.confirm(
        'Reject this job? It will be hidden from candidates.'
      )
    ) {
      return
    }
    setActionLoading(job.id)
    const notes = vettingNotes[job.id] ?? ''

    const { error } = await supabase
      .from('jobs')
      .update({
        vetting_status: 'rejected',
        status: 'paused',
        vetting_notes: notes || null,
      })
      .eq('id', job.id)

    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      void loadCounts()
    }
    setActionLoading(null)
  }

  const handleCopyLink = async (jobId: string) => {
    const { data, error } = await supabase
      .from('farm_preview_tokens')
      .select('token')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data?.token) return
    const url = window.location.origin + '/farm/preview/' + data.token
    await navigator.clipboard.writeText(url)
    setCopiedJob(jobId)
    window.setTimeout(() => setCopiedJob(null), 2000)
  }

  const handleSendReport = async (job: Job) => {
    setSendingReport(job.id)
    try {
      const res = await fetch('/api/jobs/' + job.id + '/send-preview', {
        method: 'POST',
      })
      const data = (await res.json()) as SendPreviewResponse
      if (data.success) {
        const total = data.total_applicants ?? 0
        const preview =
          typeof data.preview_url === 'string' ? data.preview_url : ''
        setReportResult((prev) => ({
          ...prev,
          [job.id]:
            'Report sent! ' +
            total +
            ' applicants. Preview: ' +
            preview,
        }))
        void loadJobs()
        void loadCounts()
      } else {
        setReportResult((prev) => ({
          ...prev,
          [job.id]: 'Error: ' + (data.error ?? 'Failed'),
        }))
      }
    } catch {
      setReportResult((prev) => ({ ...prev, [job.id]: 'Network error' }))
    }
    setSendingReport(null)
  }

  return (
    <div className='mx-auto max-w-5xl p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Sourced Jobs Pipeline
        </h1>
        <p className='mt-1 text-sm text-gray-500'>
          Manage jobs sourced from external platforms. Vet, publish, and track
          farm conversions.
        </p>
      </div>

      <div className='mb-6 grid grid-cols-5 gap-3'>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActiveTab(tab.key)}
            className={[
              'rounded-2xl border bg-white p-4 text-left transition-all',
              activeTab === tab.key
                ? 'border-brand shadow-md'
                : 'border-gray-100 shadow-sm hover:border-brand/30',
            ].join(' ')}
          >
            <p className='text-2xl font-bold text-gray-900'>{counts[tab.key]}</p>
            <p className='mt-1 text-xs text-gray-400'>{tab.label}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-32 animate-pulse rounded-2xl border border-gray-100 bg-white p-5'
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className='rounded-2xl border border-gray-100 bg-white p-12 text-center'>
          <p className='font-medium text-gray-400'>No jobs in this stage</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {jobs.map((job) => (
            <div
              key={job.id}
              className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='font-bold text-gray-900'>{job.title}</h3>
                    <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500'>
                      {job.job_type}
                    </span>
                    {job.source_reference ? (
                      <span className='rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500'>
                        {job.source_reference}
                      </span>
                    ) : null}
                    {job.source_platform ? (
                      <span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] capitalize text-blue-600'>
                        {job.source_platform.replace(/_/g, ' ')}
                      </span>
                    ) : null}
                  </div>
                  <div className='mt-1.5 flex flex-wrap items-center gap-3'>
                    <span className='flex items-center gap-1 text-xs text-gray-400'>
                      <MapPin className='h-3 w-3' aria-hidden />
                      {job.city ? job.city + ', ' : ''}
                      {job.location}
                    </span>
                    {job.source_name ? (
                      <span className='flex items-center gap-1 text-xs text-gray-400'>
                        <Building2 className='h-3 w-3' aria-hidden />
                        {job.source_name}
                      </span>
                    ) : null}
                    <span className='flex items-center gap-1 text-xs text-gray-400'>
                      <Clock className='h-3 w-3' aria-hidden />
                      {formatDistanceToNow(new Date(job.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {job.application_count !== undefined ? (
                      <span className='flex items-center gap-1 text-xs font-semibold text-brand'>
                        <Users className='h-3 w-3' aria-hidden />
                        {job.application_count} applicants
                      </span>
                    ) : null}
                    {job.application_deadline ? (
                      <span className='flex items-center gap-1 text-xs text-amber-600'>
                        <Calendar className='h-3 w-3' aria-hidden />
                        Deadline:{' '}
                        {format(
                          new Date(job.application_deadline),
                          'dd MMM yyyy'
                        )}
                      </span>
                    ) : null}
                  </div>
                  {job.vetting_notes ? (
                    <p className='mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500'>
                      Notes: {job.vetting_notes}
                    </p>
                  ) : null}
                  {reportResult[job.id] ? (
                    <p className='mt-2 rounded-lg bg-brand/5 px-3 py-2 text-xs text-brand'>
                      {reportResult[job.id]}
                    </p>
                  ) : null}
                </div>

                <div className='flex flex-shrink-0 flex-wrap items-center justify-end gap-2'>
                  <Link
                    href={'/dashboard/admin/jobs/' + job.id + '/edit'}
                    className='flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50'
                  >
                    <Eye className='h-3 w-3' aria-hidden />
                    View
                  </Link>

                  {activeTab === 'unvetted' ? (
                    <>
                      <button
                        type='button'
                        onClick={() =>
                          setShowNotesFor(
                            showNotesFor === job.id ? null : job.id
                          )
                        }
                        className='rounded-lg border border-amber-200 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50'
                      >
                        Add Notes
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleReject(job)}
                        disabled={actionLoading === job.id}
                        className='flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50'
                      >
                        <XCircle className='h-3 w-3' aria-hidden />
                        Reject
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleApprove(job)}
                        disabled={actionLoading === job.id}
                        className='flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest disabled:opacity-50'
                      >
                        <CheckCircle className='h-3 w-3' aria-hidden />
                        {actionLoading === job.id
                          ? 'Approving...'
                          : 'Approve & Publish'}
                      </button>
                    </>
                  ) : null}

                  {activeTab === 'live' ? (
                    <>
                      <button
                        type='button'
                        onClick={() => void handleCopyLink(job.id)}
                        className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50'
                      >
                        {copiedJob === job.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleSendReport(job)}
                        disabled={sendingReport === job.id}
                        className='flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50'
                      >
                        <Send className='h-3 w-3' aria-hidden />
                        {sendingReport === job.id ? 'Sending...' : 'Send Report'}
                      </button>
                    </>
                  ) : null}

                  {activeTab === 'report_sent' ? (
                    <>
                      <button
                        type='button'
                        onClick={() => void handleCopyLink(job.id)}
                        className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50'
                      >
                        {copiedJob === job.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleSendReport(job)}
                        disabled={sendingReport === job.id}
                        className='flex items-center gap-1 rounded-lg border border-purple-200 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 disabled:opacity-50'
                      >
                        <RefreshCw className='h-3 w-3' aria-hidden />
                        Resend Report
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {activeTab === 'unvetted' && showNotesFor === job.id ? (
                <div className='mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4'>
                  <div>
                    <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Application Deadline (optional)
                    </label>
                    <input
                      type='date'
                      value={deadlines[job.id] ?? ''}
                      onChange={(e) =>
                        setDeadlines((prev) => ({
                          ...prev,
                          [job.id]: e.target.value,
                        }))
                      }
                      className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Vetting Notes (optional)
                    </label>
                    <input
                      type='text'
                      value={vettingNotes[job.id] ?? ''}
                      onChange={(e) =>
                        setVettingNotes((prev) => ({
                          ...prev,
                          [job.id]: e.target.value,
                        }))
                      }
                      placeholder='e.g. Good fit for livestock graduates'
                      className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none'
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
