'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, Users } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingParticipant, TrainingSession } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type ParticipantRow = TrainingParticipant & {
  training_sessions: TrainingSession | null
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
    <div className='animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='h-5 w-2/3 rounded bg-gray-200' />
      <div className='mt-3 h-4 w-1/2 rounded bg-gray-200' />
      <div className='mt-4 h-3 w-full rounded bg-gray-200' />
    </div>
  )
}

export default function FarmTrainingPage() {
  const [rows, setRows] = useState<ParticipantRow[]>([])
  const [countMap, setCountMap] = useState<Record<string, number>>({})
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

    const sessionIds = list
      .map((r) => r.training_sessions?.id)
      .filter((id): id is string => Boolean(id))

    if (sessionIds.length > 0) {
      const { data: pc } = await supabase
        .from('training_participants')
        .select('session_id')
        .in('session_id', sessionIds)
      const m: Record<string, number> = {}
      for (const row of pc ?? []) {
        const sid = (row as { session_id: string }).session_id
        m[sid] = (m[sid] ?? 0) + 1
      }
      setCountMap(m)
    } else {
      setCountMap({})
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
      <DashboardPageHeader greeting='Training Sessions' subtitle={`${rows.length} sessions`} />

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
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
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
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
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
              description='Training sessions will appear here.'
            />
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {shown.map((row) => {
              const s = row.training_sessions
              if (!s) return null
              const n = countMap[s.id] ?? 0
              return (
                <Card key={row.id} className='overflow-hidden p-0 transition-shadow hover:shadow-md'>
                  <div className='relative h-16 bg-gradient-to-r from-forest to-brand'>
                    <div
                      className='absolute inset-0'
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <div className='absolute left-3 top-3'>
                      <Pill className='border-white/20 bg-white/20 text-white backdrop-blur-sm'>
                        {sessionTypeLabel(s.session_type)}
                      </Pill>
                    </div>
                    <div className='absolute right-3 top-3 rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
                      {formatDate(s.scheduled_at, 'dd MMM')}
                    </div>
                  </div>
                  <div className='p-4'>
                    <h2 className='font-bold text-gray-900'>{s.title}</h2>
                    {s.trainer_name ? (
                      <p className='mt-0.5 text-xs text-gray-400'>
                        Trainer: {s.trainer_name}
                      </p>
                    ) : null}
                    <p className='mt-2 flex items-center gap-1 text-xs text-gray-500'>
                      <Clock className='h-3.5 w-3.5' />
                      {formatDate(s.scheduled_at, 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className='text-xs text-gray-400'>Duration: {s.duration_minutes} minutes</p>
                    <p className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                      <Users className='h-3.5 w-3.5' />
                      {n} participants
                    </p>
                    {s.zoom_link ? (
                      <a
                        href={s.zoom_link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-3 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200'
                      >
                        Join Zoom
                      </a>
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
    </div>
  )
}
