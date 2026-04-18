'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingSession } from '@/types'
import { formatDate, GHANA_REGIONS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training sessions</h1>
            <p className="mt-1 text-gray-600">Create and review sessions</p>
          </div>
          <Button type="button" variant="primary" onClick={() => setModalOpen(true)}>
            Create session
          </Button>
        </div>

        <div className="mb-4 max-w-md">
          <Input
            label="Search"
            placeholder="Title or trainer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2">
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
                'rounded-full border px-3 py-1.5 text-sm font-medium',
                tab === key
                  ? 'border-green-700 bg-green-50 text-green-900'
                  : 'border-gray-200 bg-white text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 font-semibold text-gray-900">Title</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Type</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Category</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Region</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Trainer</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Scheduled</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Duration</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Participants</th>
                <th className="px-3 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  {[0, 1, 2, 3, 4].map((k) => (
                    <TableRowSkeleton key={k} />
                  ))}
                </>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-gray-600">
                    No sessions
                  </td>
                </tr>
              ) : (
                displayRows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-3 py-3 text-gray-800">
                      {sessionTypeLabel(s.session_type)}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{s.category ?? '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{s.region ?? '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{s.trainer_name ?? '-'}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {formatDate(s.scheduled_at, 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{s.duration_minutes}</td>
                    <td className="px-3 py-3 text-gray-700">{counts[s.id] ?? 0}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/dashboard/admin/training/${s.id}`}
                        className="font-medium text-green-700 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <Input
            label="Zoom password"
            value={zoomPassword}
            onChange={(e) => setZoomPassword(e.target.value)}
          />
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
