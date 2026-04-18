'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Paperclip } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Notice } from '@/types'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

function audienceLabel(a: string): string {
  if (a === 'all') return 'All'
  return a.charAt(0).toUpperCase() + a.slice(1)
}

export default function StudentNoticeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid || !id) {
        if (!cancelled) setLoading(false)
        return
      }
      const { data, error: qErr } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (qErr || !data) {
        setError(qErr?.message ?? 'Notice not found')
        setNotice(null)
        setLoading(false)
        return
      }
      setNotice(data as Notice)
      await supabase.from('notice_reads').upsert(
        {
          notice_id: id,
          user_id: uid,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'notice_id,user_id' }
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-600">{error || 'Notice not found'}</p>
        <Link
          href="/dashboard/student/notices"
          className="mt-4 inline-block text-sm font-medium text-green-700 hover:underline"
        >
          Back to notices
        </Link>
      </div>
    )
  }

  const attachments = notice.attachments ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dashboard/student/notices"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {formatDate(notice.created_at, 'dd MMM yyyy, HH:mm')}
        </p>
        <div className="mt-3">
          <Pill variant="gray">{audienceLabel(notice.audience)}</Pill>
        </div>
        <div
          className="prose prose-gray mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: notice.body_html }}
        />
        {attachments.length > 0 ? (
          <ul className="mt-6 space-y-2 border-t border-gray-200 pt-6">
            {attachments.map((att, idx) => (
              <li key={`${att.url}-${idx}`}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                >
                  <Paperclip className="h-4 w-4" />
                  {att.name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
