'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingParticipant, TrainingSession } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
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

export default function StudentTrainingPage() {
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
    <div className='p-4 md:p-6'>
      <DashboardPageHeader greeting='Training Sessions' subtitle={`${rows.length} sessions available`} />

        {error ? (
          <p className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </p>
        ) : null}

        <div className='mb-4 inline-flex rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm'>
          <button
            type='button'
            onClick={() => setTab('upcoming')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium',
              tab === 'upcoming'
                ? 'bg-brand text-white'
                : 'text-gray-500'
            )}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            type='button'
            onClick={() => setTab('past')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium',
              tab === 'past'
                ? 'bg-brand text-white'
                : 'text-gray-500'
            )}
          >
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className='space-y-4'>
            {[0, 1, 2, 3].map((k) => (
              <CardSkeleton key={k} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Calendar className='mx-auto h-12 w-12' />}
              title={tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
              description='Training you are assigned to will appear here.'
            />
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
                <Card key={row.id} className='overflow-hidden p-0 transition-shadow hover:shadow-md'>
                  <div className='relative h-16 bg-gradient-to-r from-blue-700 to-brand'>
                    <div
                      className='absolute inset-0'
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <div className='absolute left-3 top-3'>
                      <Pill className='border-white/20 bg-white/20 text-white backdrop-blur-sm'>{sessionTypeLabel(s.session_type)}</Pill>
                    </div>
                    <div className='absolute right-3 top-3 rounded-lg bg-white/20 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm'>
                      {formatDate(s.scheduled_at, 'dd MMM')}
                    </div>
                  </div>
                  <div className='p-4'>
                    <h2 className='font-bold text-gray-900'>{s.title}</h2>
                    {s.trainer_name ? (
                      <p className='mt-0.5 text-xs text-gray-400'>Trainer: {s.trainer_name}</p>
                    ) : null}
                    <p className='mt-2 flex items-center gap-1 text-xs text-gray-600'>
                      <Clock className='h-3.5 w-3.5' />
                      {formatDate(s.scheduled_at, 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className='text-xs text-gray-400'>Duration: {s.duration_minutes} minutes</p>
                    {isPast && att ? (
                      <div className='mt-2'>
                        {attendedLabel === 'attended' ? (
                          <span className='rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700'>Attended</span>
                        ) : (
                          <span className='rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600'>Absent</span>
                        )}
                      </div>
                    ) : null}
                    {s.zoom_link && !isPast ? (
                      <a
                        href={s.zoom_link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-3 block w-full rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-bold text-white'
                      >
                        Join Zoom Session
                      </a>
                    ) : null}
                    {row.attendance_status ? <div className='mt-2'><StatusBadge status={row.attendance_status} /></div> : null}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
    </div>
  )
}
