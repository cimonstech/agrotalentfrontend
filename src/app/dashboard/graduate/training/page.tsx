'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingParticipant, TrainingSession } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type ParticipantRow = TrainingParticipant & {
  training_sessions: TrainingSession | null
}

type TrainingAttendanceRow = {
  session_id: string
  participant_id: string
  attended?: boolean | null
  status?: string | null
}

function sessionTypeLabel(t: TrainingSession['session_type']) {
  const map: Record<TrainingSession['session_type'], string> = {
    orientation: 'Orientation',
    pre_employment: 'Pre employment',
    quarterly: 'Quarterly',
    custom: 'Custom',
  }
  return map[t] ?? t
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
    </div>
  )
}

export default function GraduateTrainingPage() {
  const [rows, setRows] = useState<ParticipantRow[]>([])
  const [attMap, setAttMap] = useState<Record<string, TrainingAttendanceRow>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const load = useCallback(async () => {
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('You must be signed in')
      setRows([])
      setLoading(false)
      return
    }
    const { data, error: qErr } = await supabase
      .from('training_participants')
      .select(
        `
        *,
        training_sessions ( * )
      `
      )
      .eq('participant_id', uid)
      .order('scheduled_at', {
        referencedTable: 'training_sessions',
        ascending: true,
      })
    if (qErr) {
      setError(qErr.message)
      setRows([])
      setLoading(false)
      return
    }
    const list = (data as ParticipantRow[]) ?? []
    setRows(list)

    const now = Date.now()
    const pastIds = list
      .map((r) => r.training_sessions)
      .filter((s): s is TrainingSession => s != null)
      .filter((s) => new Date(s.scheduled_at).getTime() <= now)
      .map((s) => s.id)

    if (pastIds.length > 0) {
      const { data: attRows } = await supabase
        .from('training_attendance')
        .select('*')
        .in('session_id', pastIds)
        .eq('participant_id', uid)
      const m: Record<string, TrainingAttendanceRow> = {}
      for (const a of (attRows as TrainingAttendanceRow[]) ?? []) {
        m[a.session_id] = a
      }
      setAttMap(m)
    } else {
      setAttMap({})
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = a.training_sessions?.scheduled_at ?? ''
      const tb = b.training_sessions?.scheduled_at ?? ''
      return new Date(ta).getTime() - new Date(tb).getTime()
    })
  }, [rows])

  const nowMs = Date.now()

  const upcoming = useMemo(
    () =>
      sorted.filter(
        (r) =>
          r.training_sessions &&
          new Date(r.training_sessions.scheduled_at).getTime() > nowMs
      ),
    [sorted, nowMs]
  )

  const past = useMemo(
    () =>
      sorted.filter(
        (r) =>
          r.training_sessions &&
          new Date(r.training_sessions.scheduled_at).getTime() <= nowMs
      ),
    [sorted, nowMs]
  )

  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training</h1>
          <p className="mt-1 text-gray-600">
            Sessions you are enrolled in
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('upcoming')}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium',
              tab === 'upcoming'
                ? 'border-green-700 bg-green-50 text-green-900'
                : 'border-gray-200 bg-white text-gray-700'
            )}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium',
              tab === 'past'
                ? 'border-green-700 bg-green-50 text-green-900'
                : 'border-gray-200 bg-white text-gray-700'
            )}
          >
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((k) => (
              <CardSkeleton key={k} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={<Calendar className="mx-auto h-12 w-12" />}
              title={tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
              description="Training you are assigned to will appear here."
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {shown.map((row) => {
              const s = row.training_sessions
              if (!s) return null
              const isPast = new Date(s.scheduled_at).getTime() <= nowMs
              const att = attMap[s.id]
              const attendedLabel =
                att?.status ??
                (att?.attended === true
                  ? 'attended'
                  : att?.attended === false
                    ? 'absent'
                    : null)
              return (
                <li
                  key={row.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="font-semibold text-gray-900">{s.title}</h2>
                  <div className="mt-2">
                    <Pill variant="gray">{sessionTypeLabel(s.session_type)}</Pill>
                  </div>
                  {(s.category || s.region) && (
                    <p className="mt-2 text-xs text-gray-500">
                      {[s.category, s.region].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {s.trainer_name ? (
                    <p className="mt-1 text-sm text-gray-700">
                      Trainer: {s.trainer_name}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-gray-800">
                    Scheduled:{' '}
                    {formatDate(s.scheduled_at, 'dd MMM yyyy, HH:mm')}
                  </p>
                  <p className="text-sm text-gray-700">
                    Duration: {s.duration_minutes} mins
                  </p>
                  {s.zoom_link ? (
                    <div className="mt-3">
                      <a
                        href={s.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                      >
                        Join Zoom
                      </a>
                    </div>
                  ) : null}
                  {row.attendance_status ? (
                    <div className="mt-3">
                      <StatusBadge status={row.attendance_status} />
                    </div>
                  ) : null}
                  {isPast && att ? (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Attendance: </span>
                      {attendedLabel ? (
                        <StatusBadge status={attendedLabel} />
                      ) : (
                        <span className="text-sm text-gray-600">Recorded</span>
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
