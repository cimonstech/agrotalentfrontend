'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { TrainingSession } from '@/types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const supabase = createSupabaseClient()

type AttendanceStatus = 'present' | 'absent' | 'late' | null

type ParticipantRow = Record<string, unknown> & {
  id?: string
  participant_id?: string
  profile?: {
    id?: string
    full_name?: string | null
    email?: string | null
    phone?: string | null
    role?: string | null
    preferred_region?: string | null
    farm_location?: string | null
  } | null
  attendance_status?: string | null
  checked_in_at?: string | null
  notes?: string | null
}

type AttendanceUpdate = { participant_id: string; attendance_status: AttendanceStatus }

function normalizeParticipant(row: Record<string, unknown>): ParticipantRow {
  const prof = row.profiles
  const profile = (Array.isArray(prof) ? prof[0] : prof) as ParticipantRow['profile']
  return {
    ...row,
    profile: profile ?? null,
    participant_id: row.participant_id as string | undefined,
  }
}

export default function AdminTrainingDetailPage() {
  const params = useParams<{ id: string }>()
  const trainingId = params?.id

  const [training, setTraining] = useState<TrainingSession | null>(null)
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(true)

  const [showAssign, setShowAssign] = useState(false)
  const [assignMode, setAssignMode] = useState<'filter' | 'selected'>('filter')
  const [assignFilters, setAssignFilters] = useState({ role: 'graduate', region: '', search: '' })
  const [candidateUsers, setCandidateUsers] = useState<
    {
      id: string
      full_name?: string | null
      email?: string | null
      preferred_region?: string | null
      farm_location?: string | null
    }[]
  >([])
  const [selectedUserIds, setSelectedUserIds] = useState<Record<string, boolean>>({})
  const [assigning, setAssigning] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)

  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceEdits, setAttendanceEdits] = useState<Record<string, AttendanceStatus>>({})

  const fetchDetail = async () => {
    if (!trainingId) return
    try {
      setLoading(true)
      const [{ data: sessionRow, error: sErr }, { data: parts }] = await Promise.all([
        supabase.from('training_sessions').select('*').eq('id', trainingId).single(),
        supabase
          .from('training_participants')
          .select(
            '*, profiles(full_name, email, role, preferred_region, farm_location, phone)'
          )
          .eq('session_id', trainingId),
      ])
      if (sErr || !sessionRow) {
        setTraining(null)
        setParticipants([])
      } else {
        setTraining(sessionRow as TrainingSession)
        setParticipants(((parts as Record<string, unknown>[]) || []).map(normalizeParticipant))
      }
      setAttendanceEdits({})
    } catch (e) {
      console.error('Failed to fetch training:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId])

  const fetchCandidates = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, preferred_region, farm_location')
        .eq('role', assignFilters.role)
        .limit(80)
      type CandidateRow = { id: string; full_name: string | null; email: string | null; role: string | null; preferred_region: string | null; farm_location: string | null }
      let users: CandidateRow[] = (data ?? []) as CandidateRow[]
      if (assignFilters.region) {
        const region = assignFilters.region.toLowerCase()
        users = users.filter((u: CandidateRow) => {
          const r = (u.preferred_region || u.farm_location || '').toLowerCase()
          return r.includes(region)
        })
      }
      if (assignFilters.search) {
        const s = assignFilters.search.toLowerCase()
        users = users.filter(
          (u: CandidateRow) =>
            (u.full_name || '').toLowerCase().includes(s) ||
            (u.email || '').toLowerCase().includes(s)
        )
      }
      setCandidateUsers(users)
    } catch (e) {
      console.error('Failed to fetch candidate users:', e)
    }
  }

  useEffect(() => {
    if (!showAssign) return
    void fetchCandidates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAssign, assignFilters.role, assignFilters.region, assignFilters.search])

  const saveAttendance = async () => {
    if (!trainingId) return
    try {
      setSavingAttendance(true)
      const updates = participants
        .map((p) => {
          const id = (p.profile?.id || p.participant_id) as string
          const next = attendanceEdits[id]
          if (!next) return null
          return { participant_id: id, attendance_status: next }
        })
        .filter(Boolean) as AttendanceUpdate[]
      if (!updates.length) return
      for (const u of updates) {
        const { error } = await supabase
          .from('training_participants')
          .update({
            attendance_status: u.attendance_status,
            checked_in_at:
              u.attendance_status === 'present' || u.attendance_status === 'late'
                ? new Date().toISOString()
                : null,
          })
          .eq('session_id', trainingId)
          .eq('participant_id', u.participant_id)
        if (error) throw new Error(error.message)
      }
      await fetchDetail()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save attendance')
    } finally {
      setSavingAttendance(false)
    }
  }

  const bulkSetAttendance = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = { ...attendanceEdits }
    participants.forEach((p) => {
      const id = (p.profile?.id || p.participant_id) as string
      next[id] = status
    })
    setAttendanceEdits(next)
  }

  const exportParticipantsExcel = () => {
    const rows = participants.map((p) => ({
      name: p.profile?.full_name || '',
      email: p.profile?.email || '',
      phone: p.profile?.phone || '',
      role: p.profile?.role || '',
      region: p.profile?.preferred_region || p.profile?.farm_location || '',
      attendance_status: p.attendance_status || '',
      checked_in_at: p.checked_in_at || '',
      notes: p.notes || '',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Participants')
    XLSX.writeFile(wb, `training-${trainingId}-participants.xlsx`)
  }

  const exportParticipantsPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    doc.setFontSize(14)
    doc.text(`Training Attendance - ${training?.title || ''}`, 40, 40)
    doc.setFontSize(10)
    doc.text(`Region: ${training?.region || '-'}   Date: ${training?.scheduled_at ? new Date(training.scheduled_at).toLocaleString() : '-'}`, 40, 58)
    autoTable(doc, {
      startY: 75,
      head: [['Name', 'Role', 'Region', 'Attendance', 'Checked in']],
      body: participants.map((p) => [
        p.profile?.full_name || '',
        p.profile?.role || '',
        p.profile?.preferred_region || p.profile?.farm_location || '',
        p.attendance_status || '',
        p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : '',
      ]),
    })
    doc.save(`training-${trainingId}-attendance.pdf`)
  }

  const participantsStats = useMemo(() => {
    const total = participants.length
    const present = participants.filter((p) => p.attendance_status === 'present').length
    const late = participants.filter((p) => p.attendance_status === 'late').length
    const absent = participants.filter((p) => p.attendance_status === 'absent').length
    const pending = total - present - late - absent
    return { total, present, late, absent, pending }
  }, [participants])

  const doAssign = async () => {
    if (!trainingId) return
    try {
      setAssigning(true)
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth.user?.id
      if (!currentUserId) {
        alert('You must be signed in.')
        setAssigning(false)
        return
      }
      const existing = new Set(
        participants.map((p) => String(p.profile?.id || p.participant_id || ''))
      )
      let userIds: string[] = []
      if (assignMode === 'selected') {
        userIds = Object.entries(selectedUserIds)
          .filter(([, v]) => v)
          .map(([k]) => k)
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, preferred_region, farm_location')
          .eq('role', assignFilters.role)
          .limit(200)
        type ListRow = { id: string; full_name: string | null; email: string | null; preferred_region: string | null; farm_location: string | null }
        let list: ListRow[] = (data ?? []) as ListRow[]
        if (assignFilters.region) {
          const region = assignFilters.region.toLowerCase()
          list = list.filter((u: ListRow) => {
            const r = (u.preferred_region || u.farm_location || '').toLowerCase()
            return r.includes(region)
          })
        }
        if (assignFilters.search) {
          const s = assignFilters.search.toLowerCase()
          list = list.filter(
            (u: ListRow) =>
              (u.full_name || '').toLowerCase().includes(s) ||
              (u.email || '').toLowerCase().includes(s)
          )
        }
        userIds = list.map((u: ListRow) => u.id)
      }
      const toAdd = userIds.filter((id) => id && !existing.has(id))
      if (!toAdd.length) {
        alert('No new participants to assign.')
        setAssigning(false)
        return
      }
      const rows = toAdd.map((participant_id) => ({
        session_id: trainingId,
        participant_id,
        assigned_by: currentUserId,
      }))
      const { error } = await supabase.from('training_participants').insert(rows)
      if (error) throw new Error(error.message)
      void notifyEmail
      void notifySms
      alert(`Assigned: ${toAdd.length}`)
      setShowAssign(false)
      setSelectedUserIds({})
      await fetchDetail()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to assign participants')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-6">
          <Link href="/dashboard/admin/training" className="text-sm text-primary hover:underline">
            ← Back to Training
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">Loading training...</div>
        ) : (
          <>
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{training?.title}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {training?.category || 'training'} • {training?.region || '-'} •{' '}
                    {training?.scheduled_at ? new Date(training.scheduled_at).toLocaleString() : '-'}
                  </p>
                  {training?.zoom_link && (
                    <a className="inline-block mt-3 text-primary hover:underline" href={training.zoom_link} target="_blank" rel="noreferrer">
                      <i className="fas fa-video mr-2"></i>Open Zoom Link
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssign(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Assign Participants
                  </button>
                  <button
                    onClick={exportParticipantsPdf}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={exportParticipantsExcel}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                ['Total', participantsStats.total],
                ['Present', participantsStats.present],
                ['Late', participantsStats.late],
                ['Absent', participantsStats.absent],
                ['Pending', participantsStats.pending],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{value as number}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Participants & Attendance</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => bulkSetAttendance('present')}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => bulkSetAttendance('absent')}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Mark All Absent
                  </button>
                  <button
                    onClick={() => void saveAttendance()}
                    disabled={savingAttendance}
                    className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingAttendance ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-10 text-gray-600 dark:text-gray-400">No participants assigned yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Name</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Role</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Region</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Attendance</th>
                        <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Checked In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {participants.map((p) => {
                        const pid = (p.profile?.id || p.participant_id) as string
                        const rowKey = (p.id as string) || pid
                        const current = attendanceEdits[pid] ?? ((p.attendance_status || null) as AttendanceStatus)
                        return (
                          <tr key={rowKey}>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900 dark:text-white">{p.profile?.full_name || '-'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{p.profile?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">{p.profile?.role || '-'}</td>
                            <td className="px-4 py-3 text-sm">{p.profile?.preferred_region || p.profile?.farm_location || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              <select
                                value={current || ''}
                                onChange={(e) =>
                                  setAttendanceEdits((prev) => ({
                                    ...prev,
                                    [pid]: (e.target.value || null) as AttendanceStatus,
                                  }))
                                }
                                className="px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                              >
                                <option value="">Pending</option>
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm">{p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 my-8">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Participants</h2>
              <button type="button" onClick={() => setShowAssign(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignMode('filter')}
                  className={`px-3 py-2 rounded-lg border ${assignMode === 'filter' ? 'bg-primary text-white border-primary' : 'border-gray-300 dark:border-white/20'}`}
                >
                  Assign by Filter
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('selected')}
                  className={`px-3 py-2 rounded-lg border ${assignMode === 'selected' ? 'bg-primary text-white border-primary' : 'border-gray-300 dark:border-white/20'}`}
                >
                  Select Individuals
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={assignFilters.role}
                  onChange={(e) => setAssignFilters((prev) => ({ ...prev, role: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                >
                  <option value="graduate">Graduates</option>
                  <option value="student">Students</option>
                  <option value="farm">Farms/Managers</option>
                </select>
                <input
                  value={assignFilters.region}
                  onChange={(e) => setAssignFilters((prev) => ({ ...prev, region: e.target.value }))}
                  placeholder="Region (optional)"
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                />
                <input
                  value={assignFilters.search}
                  onChange={(e) => setAssignFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Search name/email..."
                  className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark"
                />
              </div>

              {assignMode === 'selected' && (
                <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                  <div className="max-h-72 overflow-auto">
                    {candidateUsers.map((u) => (
                      <label key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <input
                          type="checkbox"
                          checked={!!selectedUserIds[u.id]}
                          onChange={(e) => setSelectedUserIds((prev) => ({ ...prev, [u.id]: e.target.checked }))}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{u.full_name || u.email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.preferred_region || u.farm_location || ''}</div>
                      </label>
                    ))}
                    {candidateUsers.length === 0 && (
                      <div className="px-4 py-6 text-center text-gray-600 dark:text-gray-400">No users found.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                  Send Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
                  Send SMS (logged for now)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssign(false)}
                className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void doAssign()}
                disabled={assigning}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
