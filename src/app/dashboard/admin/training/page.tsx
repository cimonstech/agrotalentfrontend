'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingSession } from '@/types'
import { formatDate, GHANA_REGIONS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { StatusBadge, Pill } from '@/components/ui/Badge'
import { timeAgo, formatCurrency, ROLE_LABELS } from '@/lib/utils'

const supabase = createSupabaseClient()

const PAGE_SIZE = 20

const SESSION_TYPES: { value: TrainingSession['session_type']; label: string }[] =
  [
    { value: 'orientation', label: 'Orientation' },
    { value: 'pre_employment', label: 'Pre employment' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'custom', label: 'Custom' },
  ]

const REGION_OPTS = [
  { value: '', label: 'Any region' },
  ...GHANA_REGIONS.map((r) => ({ value: r, label: r })),
]

const ATTENDANCE_OPTS = [
  { value: 'manual', label: 'Manual' },
  { value: 'zoom', label: 'Zoom' },
]

type TabKey = 'all' | 'upcoming' | 'past'

function sessionTypeLabel(t: TrainingSession['session_type']) {
  const map: Record<TrainingSession['session_type'], string> = {
    orientation: 'Orientation',
    pre_employment: 'Pre employment',
    quarterly: 'Quarterly',
    custom: 'Custom',
  }
  return map[t] ?? t
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
        <td key={c} className="px-3 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminTrainingPage() {
  const [rows, setRows] = useState<TrainingSession[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sessionType, setSessionType] =
    useState<TrainingSession['session_type']>('orientation')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [trainerType, setTrainerType] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const [zoomMeetingId, setZoomMeetingId] = useState('')
  const [zoomPassword, setZoomPassword] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [attendanceMethod, setAttendanceMethod] = useState('manual')

  const load = useCallback(async () => {
    setError('')
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const nowIso = new Date().toISOString()
    let q = supabase
      .from('training_sessions')
      .select('*', { count: 'exact' })
      .order('scheduled_at', { ascending: false })
    if (tab === 'upcoming') {
      q = q.gt('scheduled_at', nowIso)
    } else if (tab === 'past') {
      q = q.lte('scheduled_at', nowIso)
    }
    const { data, error: qErr, count } = await q.range(from, to)
    if (qErr) {
      setError(qErr.message)
      setRows([])
      setTotal(0)
      setLoading(false)
      return
    }
    const list = (data as TrainingSession[]) ?? []
    setRows(list)
    setTotal(count ?? 0)

    const ids = list.map((s) => s.id)
    if (ids.length > 0) {
      const { data: pc } = await supabase
        .from('training_participants')
        .select('session_id')
        .in('session_id', ids)
      const m: Record<string, number> = {}
      for (const row of pc ?? []) {
        const sid = (row as { session_id: string }).session_id
        m[sid] = (m[sid] ?? 0) + 1
      }
      setCounts(m)
    } else {
      setCounts({})
    }
    setLoading(false)
  }, [page, tab])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  function resetForm() {
    setTitle('')
    setDescription('')
    setSessionType('orientation')
    setCategory('')
    setRegion('')
    setTrainerName('')
    setTrainerType('')
    setZoomLink('')
    setZoomMeetingId('')
    setZoomPassword('')
    setScheduledAt('')
    setDurationMinutes(60)
    setAttendanceMethod('manual')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setSaving(false)
      return
    }
    const scheduledIso = scheduledAt
      ? new Date(scheduledAt).toISOString()
      : null
    if (!scheduledIso) {
      setSaving(false)
      return
    }
    const { error: insErr } = await supabase.from('training_sessions').insert({
      title,
      description: description.trim() || null,
      session_type: sessionType,
      category: category.trim() || null,
      region: region || null,
      trainer_name: trainerName.trim() || null,
      trainer_type: trainerType.trim() || null,
      zoom_link: zoomLink.trim() || null,
      zoom_meeting_id: zoomMeetingId.trim() || null,
      zoom_password: zoomPassword.trim() || null,
      scheduled_at: scheduledIso,
      duration_minutes: durationMinutes,
      attendance_method: attendanceMethod || null,
      created_by: uid,
    })
    setSaving(false)
    if (insErr) {
      setError(insErr.message)
      return
    }
    setModalOpen(false)
    resetForm()
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((s) => {
      const t = (s.title ?? '').toLowerCase()
      const tr = (s.trainer_name ?? '').toLowerCase()
      return t.includes(q) || tr.includes(q)
    })
  }, [rows, search])

  function selectTab(next: TabKey) {
    setTab(next)
    setPage(1)
  }

  return (
    <div className='font-ubuntu'>
      <div className='mx-auto max-w-7xl p-6'>
        <DashboardPageHeader
          greeting='Training Management'
          subtitle={`${total} sessions`}
          actions={
            <Button type='button' variant='primary' onClick={() => setModalOpen(true)}>
              Create Session
            </Button>
          }
        />

        <div className='mb-4 max-w-md'>
          <Input
            label='Search'
            placeholder='Title or trainer'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className='mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          {(
            [
              ['all', 'All'],
              ['upcoming', 'Upcoming'],
              ['past', 'Past'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => selectTab(key)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium',
                tab === key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {loading ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <Card key={k} className='h-48 animate-pulse bg-gray-100 p-0'>
                  <div />
                </Card>
              ))}
            </>
          ) : displayRows.length === 0 ? (
            <Card className='col-span-full p-8 text-center text-sm text-gray-500'>
              No sessions
            </Card>
          ) : (
            displayRows.map((s) => (
              <Card key={s.id} className='overflow-hidden p-0 transition-shadow hover:shadow-md'>
                <div className='relative h-16 bg-gradient-to-r from-forest to-brand'>
                  <div
                    className='absolute inset-0 opacity-15'
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)', backgroundSize: '16px 16px' }}
                  />
                  <span className='absolute left-3 top-3 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm'>
                    {sessionTypeLabel(s.session_type)}
                  </span>
                  <span className='absolute right-3 top-3 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm'>
                    {counts[s.id] ?? 0} participants
                  </span>
                </div>
                <div className='p-4'>
                  <p className='text-sm font-bold text-gray-900'>{s.title}</p>
                  <p className='mt-0.5 text-xs text-gray-400'>{s.trainer_name ?? 'No trainer'}</p>
                  <p className='mt-2 flex items-center gap-1 text-xs text-gray-600'>
                    <Calendar className='h-3.5 w-3.5' />
                    {formatDate(s.scheduled_at, 'dd MMM yyyy, HH:mm')}
                  </p>
                  <p className='mt-1 text-xs text-gray-400'>{s.duration_minutes} minutes</p>
                  {s.region ? (
                    <span className='mt-2 inline-flex rounded-full bg-brand/8 px-2 py-0.5 text-xs font-semibold text-brand'>
                      {s.region}
                    </span>
                  ) : null}
                  <div className='mt-3 flex gap-2'>
                    <Link
                      href={`/dashboard/admin/training/${s.id}`}
                      className='rounded-lg bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15'
                    >
                      View Details
                    </Link>
                    <button
                      type='button'
                      className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50'
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title="Create training session"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Session type"
            options={SESSION_TYPES}
            value={sessionType}
            onChange={(e) =>
              setSessionType(e.target.value as TrainingSession['session_type'])
            }
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            label="Region"
            options={REGION_OPTS}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <Input
            label="Trainer name"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
          />
          <Input
            label="Trainer type"
            value={trainerType}
            onChange={(e) => setTrainerType(e.target.value)}
          />
          <Input
            label="Zoom link"
            type="url"
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
          />
          <Input
            label="Zoom meeting ID"
            value={zoomMeetingId}
            onChange={(e) => setZoomMeetingId(e.target.value)}
          />
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Zoom password
            </label>
            <PasswordInput
              value={zoomPassword}
              onChange={(e) => setZoomPassword(e.target.value)}
              placeholder='Meeting password (optional)'
              autoComplete='new-password'
              name='zoom_password'
              id='training-zoom-password'
            />
          </div>
          <Input
            label="Scheduled at"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
          />
          <Select
            label="Attendance method"
            options={ATTENDANCE_OPTS}
            value={attendanceMethod}
            onChange={(e) => setAttendanceMethod(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
