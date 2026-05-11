'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Send,
  Users,
  XCircle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  buildSourceCatalogGroups,
  sourceGroupMatchesQuery,
  type SourcedCatalogJobFields,
} from '@/lib/sourced-source-groups'
import { fetchApplicationCountsByJobIds } from '@/lib/application-counts'
import type { Job } from '@/types'
import { Button } from '@/components/ui/Button'

const supabase = createSupabaseClient()

const SOURCED_LIST_PAGE_SIZE = 8
const PIPELINE_PAGE_SIZE = 10
/** Listings shown per source row in the catalog table (second-level pagination). */
const SOURCE_ROW_LISTINGS_PAGE_SIZE = 8

/** Catalog rows — excludes paused/closed jobs from the sourced-source directory only. */
type SourcedCatalogJob = SourcedCatalogJobFields

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

  const [catalogJobs, setCatalogJobs] = useState<SourcedCatalogJob[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [sourceListSearch, setSourceListSearch] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const [pipelinePage, setPipelinePage] = useState(1)
  /** Pagination within one source row when it has many job listings. */
  const [listingsPageByGroup, setListingsPageByGroup] = useState<
    Record<string, number>
  >({})

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
    const list = (data as Job[]) ?? []
    const live =
      list.length > 0
        ? await fetchApplicationCountsByJobIds(
            supabase,
            list.map((j) => j.id)
          )
        : {}
    setJobs(
      list.map((j) => ({
        ...j,
        application_count: live[j.id] ?? j.application_count ?? 0,
      }))
    )
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    void loadJobs()
    void loadCounts()
  }, [loadJobs, loadCounts])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select(
          `
          id,
          title,
          source_name,
          source_contact_name,
          source_contact,
          source_phone,
          source_email,
          source_platform,
          source_website,
          source_platform_url
        `
        )
        .eq('is_sourced_job', true)
        .is('deleted_at', null)
        .in('status', ['draft', 'active', 'filled'])
        .order('created_at', { ascending: false })
      if (!cancelled) {
        if (error) {
          console.warn('[sourced-jobs catalog]', error.message)
          setCatalogJobs([])
        } else {
          setCatalogJobs((data as SourcedCatalogJob[]) ?? [])
        }
        setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sourceGroups = useMemo(
    () => buildSourceCatalogGroups(catalogJobs),
    [catalogJobs]
  )

  const filteredSourceGroups = useMemo(
    () =>
      sourceGroups.filter((g) =>
        sourceGroupMatchesQuery(g, sourceListSearch)
      ),
    [sourceGroups, sourceListSearch]
  )

  useEffect(() => {
    setCatalogPage(1)
    setListingsPageByGroup({})
  }, [sourceListSearch])

  useEffect(() => {
    setPipelinePage(1)
  }, [activeTab])

  const catalogTotalPages = Math.max(
    1,
    Math.ceil(filteredSourceGroups.length / SOURCED_LIST_PAGE_SIZE)
  )
  const catalogPageEffective = Math.min(catalogPage, catalogTotalPages)
  const paginatedSourceGroups = filteredSourceGroups.slice(
    (catalogPageEffective - 1) * SOURCED_LIST_PAGE_SIZE,
    catalogPageEffective * SOURCED_LIST_PAGE_SIZE
  )

  const pipelineTotalPages = Math.max(1, Math.ceil(jobs.length / PIPELINE_PAGE_SIZE))
  const pipelinePageEffective = Math.min(pipelinePage, pipelineTotalPages)
  const paginatedPipelineJobs = jobs.slice(
    (pipelinePageEffective - 1) * PIPELINE_PAGE_SIZE,
    pipelinePageEffective * PIPELINE_PAGE_SIZE
  )

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
    if (error) {
      window.alert('No preview link yet. Click Send Report first to generate one.')
      return
    }
    if (!data?.token) {
      window.alert('No preview link yet. Click Send Report first to generate one.')
      return
    }
    const url = window.location.origin + '/farm/preview/' + data.token
    try {
      await navigator.clipboard.writeText(url)
      setCopiedJob(jobId)
      window.setTimeout(() => setCopiedJob(null), 2000)
    } catch {
      window.alert('Could not copy link. Try again or copy the URL manually.')
    }
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

      <section className='mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Sourced list</h2>
            <p className='mt-1 text-sm text-gray-500'>
              Every external source and contact from active sourced listings (paused or closed jobs
              are omitted). Sources are grouped when the organisation and contact match, even if
              email was saved in different fields. Search across names, platforms, contacts, and job
              titles.
            </p>
          </div>
          <p className='shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700'>
            {catalogLoading ? (
              'Loading…'
            ) : (
              <>
                <span className='text-brand'>{filteredSourceGroups.length}</span>
                {sourceListSearch.trim()
                  ? ` of ${sourceGroups.length} sources`
                  : ` sources · ${catalogJobs.length} jobs`}
              </>
            )}
          </p>
        </div>

        <div className='relative mt-4'>
          <Search
            className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
            aria-hidden
          />
          <input
            type='search'
            placeholder='Search sources, platforms, phones, emails, or job titles…'
            value={sourceListSearch}
            onChange={(e) => setSourceListSearch(e.target.value)}
            className='w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15'
            aria-label='Search sourced list'
          />
        </div>

        <div className='mt-4 overflow-x-auto rounded-xl border border-gray-100'>
          {catalogLoading ? (
            <div className='space-y-2 p-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='h-14 animate-pulse rounded-lg bg-gray-100' />
              ))}
            </div>
          ) : filteredSourceGroups.length === 0 ? (
            <p className='p-6 text-center text-sm text-gray-500'>
              {sourceListSearch.trim()
                ? 'No sources match your search.'
                : 'No sourced jobs in the catalog.'}
            </p>
          ) : (
            <table className='w-full min-w-[640px] text-left text-sm'>
              <thead className='sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                <tr>
                  <th className='whitespace-nowrap px-3 py-2.5'>Source / org</th>
                  <th className='whitespace-nowrap px-3 py-2.5'>Platform</th>
                  <th className='min-w-[200px] px-3 py-2.5'>Contacts</th>
                  <th className='whitespace-nowrap px-3 py-2.5'>Jobs</th>
                  <th className='min-w-[160px] px-3 py-2.5'>Listings</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {paginatedSourceGroups.map((g) => (
                  <tr key={g.key} className='bg-white hover:bg-gray-50/80'>
                    <td className='align-top px-3 py-3 font-medium text-gray-900'>
                      {g.source_name?.trim() ? g.source_name : (
                        <span className='text-gray-400'>—</span>
                      )}
                    </td>
                    <td className='align-top px-3 py-3 text-gray-600'>
                      {g.source_platform?.trim() ? (
                        <span className='capitalize'>
                          {g.source_platform.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className='text-gray-400'>—</span>
                      )}
                    </td>
                    <td className='align-top px-3 py-3'>
                      <ul className='space-y-1 text-xs text-gray-600'>
                        {g.source_contact_name?.trim() ? (
                          <li>{g.source_contact_name}</li>
                        ) : null}
                        {g.source_contact?.trim() ? (
                          <li className='text-gray-500'>{g.source_contact}</li>
                        ) : null}
                        {g.source_phone?.trim() ? (
                          <li>
                            <a
                              href={`tel:${g.source_phone.replace(/\s/g, '')}`}
                              className='inline-flex items-center gap-1 text-brand hover:underline'
                            >
                              <Phone className='h-3 w-3 shrink-0' aria-hidden />
                              {g.source_phone}
                            </a>
                          </li>
                        ) : null}
                        {g.source_email?.trim() ? (
                          <li>
                            <a
                              href={`mailto:${g.source_email}`}
                              className='inline-flex items-center gap-1 text-brand hover:underline'
                            >
                              <Mail className='h-3 w-3 shrink-0' aria-hidden />
                              {g.source_email}
                            </a>
                          </li>
                        ) : null}
                        {g.source_website?.trim() ? (
                          <li>
                            <a
                              href={g.source_website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 text-brand hover:underline'
                            >
                              <ExternalLink className='h-3 w-3 shrink-0' aria-hidden />
                              Website
                            </a>
                          </li>
                        ) : null}
                        {g.source_platform_url?.trim() ? (
                          <li>
                            <a
                              href={g.source_platform_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 text-brand hover:underline'
                            >
                              <ExternalLink className='h-3 w-3 shrink-0' aria-hidden />
                              Listing URL
                            </a>
                          </li>
                        ) : null}
                        {!g.source_contact_name?.trim() &&
                        !g.source_contact?.trim() &&
                        !g.source_phone?.trim() &&
                        !g.source_email?.trim() &&
                        !g.source_website?.trim() &&
                        !g.source_platform_url?.trim() ? (
                          <li className='text-gray-400'>No contacts on file</li>
                        ) : null}
                      </ul>
                    </td>
                    <td className='align-top whitespace-nowrap px-3 py-3'>
                      <span className='inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand'>
                        {g.jobCount}
                      </span>
                    </td>
                    <td className='align-top px-3 py-3'>
                      {(() => {
                        const listingsTotalPages = Math.max(
                          1,
                          Math.ceil(
                            g.jobs.length / SOURCE_ROW_LISTINGS_PAGE_SIZE
                          )
                        )
                        const listingsPageRaw =
                          listingsPageByGroup[g.key] ?? 1
                        const listingsPageEff = Math.min(
                          listingsPageRaw,
                          listingsTotalPages
                        )
                        const sliceStart =
                          (listingsPageEff - 1) * SOURCE_ROW_LISTINGS_PAGE_SIZE
                        const rowJobs = g.jobs.slice(
                          sliceStart,
                          sliceStart + SOURCE_ROW_LISTINGS_PAGE_SIZE
                        )
                        return (
                          <>
                            <ul className='max-h-52 space-y-1 overflow-y-auto text-xs text-gray-600'>
                              {rowJobs.map((j) => (
                                <li key={j.id}>
                                  <Link
                                    href={`/jobs/${j.id}`}
                                    className='text-brand hover:underline'
                                  >
                                    {j.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            {listingsTotalPages > 1 ? (
                              <div className='mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500'>
                                <span>
                                  {sliceStart + 1}–
                                  {Math.min(
                                    sliceStart + SOURCE_ROW_LISTINGS_PAGE_SIZE,
                                    g.jobs.length
                                  )}{' '}
                                  of {g.jobs.length}
                                </span>
                                <div className='flex gap-1'>
                                  <button
                                    type='button'
                                    disabled={listingsPageEff <= 1}
                                    onClick={() =>
                                      setListingsPageByGroup((prev) => ({
                                        ...prev,
                                        [g.key]: Math.max(
                                          1,
                                          listingsPageEff - 1
                                        ),
                                      }))
                                    }
                                    className='rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'
                                  >
                                    Prev
                                  </button>
                                  <button
                                    type='button'
                                    disabled={
                                      listingsPageEff >= listingsTotalPages
                                    }
                                    onClick={() =>
                                      setListingsPageByGroup((prev) => ({
                                        ...prev,
                                        [g.key]: Math.min(
                                          listingsTotalPages,
                                          listingsPageEff + 1
                                        ),
                                      }))
                                    }
                                    className='rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!catalogLoading && filteredSourceGroups.length > 0 ? (
          <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600'>
            <p>
              Page{' '}
              <span className='font-semibold text-gray-900'>{catalogPageEffective}</span> of{' '}
              <span className='font-semibold text-gray-900'>{catalogTotalPages}</span>
              <span className='text-gray-400'>
                {' '}
                · Showing{' '}
                {(catalogPageEffective - 1) * SOURCED_LIST_PAGE_SIZE + 1}
                –
                {Math.min(
                  catalogPageEffective * SOURCED_LIST_PAGE_SIZE,
                  filteredSourceGroups.length
                )}{' '}
                of {filteredSourceGroups.length} sources
              </span>
            </p>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={catalogPageEffective <= 1 || catalogLoading}
                onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={catalogPageEffective >= catalogTotalPages || catalogLoading}
                onClick={() =>
                  setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className='mb-6 grid grid-cols-5 gap-3'>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => {
              setActiveTab(tab.key)
              setPipelinePage(1)
            }}
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
        <>
          <div className='space-y-3'>
          {paginatedPipelineJobs.map((job) => (
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
                      {(() => {
                        const postedDate = job.created_at
                          ? new Date(job.created_at)
                          : new Date()
                        const isValidDate =
                          !Number.isNaN(postedDate.getTime()) &&
                          postedDate.getFullYear() > 2020
                        return isValidDate
                          ? formatDistanceToNow(postedDate, { addSuffix: true })
                          : 'Recently'
                      })()}
                    </span>
                    <span className='flex items-center gap-1 text-xs font-semibold text-brand'>
                      <Users className='h-3 w-3' aria-hidden />
                      {job.application_count ?? 0} applicants
                    </span>
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
                    href={'/jobs/' + job.id}
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

          {jobs.length > PIPELINE_PAGE_SIZE ? (
            <div className='mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600'>
              <p>
                Page{' '}
                <span className='font-semibold text-gray-900'>
                  {pipelinePageEffective}
                </span>{' '}
                of{' '}
                <span className='font-semibold text-gray-900'>
                  {pipelineTotalPages}
                </span>
                <span className='text-gray-400'>
                  {' '}
                  · {(pipelinePageEffective - 1) * PIPELINE_PAGE_SIZE + 1}–
                  {Math.min(
                    pipelinePageEffective * PIPELINE_PAGE_SIZE,
                    jobs.length
                  )}{' '}
                  of {jobs.length} jobs
                </span>
              </p>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={pipelinePageEffective <= 1 || loading}
                  onClick={() => setPipelinePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={pipelinePageEffective >= pipelineTotalPages || loading}
                  onClick={() =>
                    setPipelinePage((p) => Math.min(pipelineTotalPages, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
