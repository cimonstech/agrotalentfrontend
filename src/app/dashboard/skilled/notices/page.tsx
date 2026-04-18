'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { formatDate, truncate, cn } from '@/lib/utils'
import type { Notice } from '@/types'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

const supabase = createSupabaseClient()

const AUDIENCE = 'skilled'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function SkilledNoticesPage() {
  const [rows, setRows] = useState<Notice[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setRows([])
      setLoading(false)
      return
    }
    const { data: notices, error: nErr } = await supabase
      .from('notices')
      .select('*')
      .or(`audience.eq.all,audience.eq.${AUDIENCE}`)
      .order('created_at', { ascending: false })
    if (nErr) {
      setError(nErr.message)
      setLoading(false)
      return
    }
    const list = (notices as Notice[]) ?? []
    setRows(list)
    if (list.length === 0) {
      setReadIds(new Set())
      setLoading(false)
      return
    }
    const ids = list.map((n) => n.id)
    const { data: reads } = await supabase
      .from('notice_reads')
      .select('notice_id')
      .eq('user_id', uid)
      .in('notice_id', ids)
    const rs = new Set(
      (reads ?? []).map((r: { notice_id: string }) => r.notice_id)
    )
    setReadIds(rs)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Notices</h1>
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="h-5 w-1/2 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
                <div className="mt-4 h-12 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="mx-auto h-12 w-12 text-gray-400" />}
            title="No notices"
            description="Check back later for updates."
          />
        ) : (
          <ul className="space-y-4">
            {rows.map((n) => {
              const read = readIds.has(n.id)
              const preview = truncate(stripHtml(n.body_html ?? ''), 150)
              return (
                <li key={n.id}>
                  <Card
                    className={cn(
                      read ? 'bg-gray-50' : 'border-l-4 border-l-green-600 bg-white'
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {n.title}
                      </h2>
                      {!read ? (
                        <Pill variant="green">New</Pill>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(n.created_at, 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="mt-3 text-sm text-gray-600">{preview}</p>
                    <Link
                      href={`/dashboard/skilled/notices/${n.id}`}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Read Notice
                    </Link>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
