'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Megaphone } from 'lucide-react'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getSessionOnce } from '@/lib/get-session-once'
import type { Notice } from '@/types'
import { Card, StatCard, HeroCard } from '@/components/ui/Card'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { StatusBadge, Pill } from '@/components/ui/Badge'
import { formatDate, timeAgo, formatCurrency, ROLE_LABELS } from '@/lib/utils'

const supabase = createSupabaseClient()

/** Converts plain text (with newlines) to HTML with paragraphs and bullet lists. */
function plainTextToHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const bolden = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const out: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd())
    const listMarker = /^[-•*·]\s*/
    const listLines = lines.filter((l) => listMarker.test(l))
    const isListBlock = listLines.length >= 1 && (listLines.length === lines.length || listLines.length >= lines.length - 1)

    if (isListBlock && listLines.length > 0) {
      const intro = lines.filter((l) => !listMarker.test(l))
      if (intro.length > 0) {
        out.push('<p>' + bolden(escape(intro.join(' '))) + '</p>')
      }
      out.push('<ul>')
      for (const line of listLines) {
        const content = line.replace(listMarker, '')
        out.push('<li>' + bolden(escape(content)) + '</li>')
      }
      out.push('</ul>')
    } else {
      const para = lines.join(' ')
      if (para) out.push('<p>' + bolden(escape(para)) + '</p>')
    }
  }

  return out.join('')
}

export default function AdminNoticesPage() {
  const PAGE_SIZE = 10
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    body_html: '',
    link: '',
    audience: 'all',
  })
  const [attachments, setAttachments] = useState<{ url: string; file_name: string }[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const { data, error: qErr } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
      if (qErr) {
        console.error('Failed to fetch notices:', qErr)
      } else {
        setNotices((data as Notice[]) ?? [])
      }
    } catch (e) {
      console.error('Failed to fetch notices:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchNotices()
  }, [])

  useEffect(() => {
    if (page > Math.max(1, Math.ceil(notices.length / PAGE_SIZE))) {
      setPage(1)
    }
  }, [notices.length, page])

  const totalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE))
  const paginatedNotices = notices.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingImage(true)
    setError('')
    try {
      const session = await getSessionOnce()
      const token = session?.access_token
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/notices/upload-image', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        })
        const result = (await res.json().catch(() => ({}))) as {
          url?: string
          file_name?: string
          error?: string
        }
        if (!res.ok) {
          throw new Error(result.error || 'Image upload failed')
        }
        if (result.url && result.file_name) {
          setAttachments((prev) => [
            ...prev,
            { url: result.url!, file_name: result.file_name! },
          ])
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body_html.trim()) {
      setError('Title and body are required.')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth.user?.id
      if (!currentUserId) {
        setError('You must be signed in.')
        setSubmitting(false)
        return
      }
      const attachmentPayload =
        attachments.length > 0
          ? attachments.map((a) => ({ name: a.file_name, url: a.url }))
          : []
      const { data: newNotice, error: insErr } = await supabase
        .from('notices')
        .insert({
          title: form.title.trim(),
          body_html: form.body_html.trim(),
          audience: form.audience,
          link: form.link.trim() || null,
          attachments: attachmentPayload,
          created_by: currentUserId,
        })
        .select()
        .single()
      if (insErr) {
        setError(insErr.message)
        setSubmitting(false)
        return
      }
      if (newNotice) {
        setNotices((prev) => [newNotice as Notice, ...prev])
      }
      setShowCreateModal(false)
      setForm({ title: '', body_html: '', link: '', audience: 'all' })
      setAttachments([])
      void fetchNotices()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create notice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noticeId: string) => {
    setDeletingId(noticeId)
    const { error: delErr } = await supabase.from('notices').delete().eq('id', noticeId)
    setDeletingId(null)
    if (delErr) {
      alert(delErr.message)
      return
    }
    setNotices((prev) => prev.filter((n) => n.id !== noticeId))
  }

  return (
    <div className='font-ubuntu'>
      <div className='mx-auto max-w-7xl p-6'>
        <DashboardPageHeader greeting='Notices' subtitle={`${notices.length} notices`} />

        <Card className='mb-6 p-6'>
          <h3 className='mb-4 text-sm font-semibold text-gray-900'>Post Notice</h3>
          {error ? <p className='mb-3 text-xs text-red-600'>{error}</p> : null}
          <div className='grid grid-cols-1 gap-3'>
            <input
              type='text'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm'
              placeholder='Notice title'
            />
            <select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm'
            >
              <option value='all'>All users</option>
              <option value='graduate'>Graduate</option>
              <option value='farm'>Farm</option>
              <option value='student'>Student</option>
              <option value='skilled'>Skilled</option>
            </select>
            <textarea
              value={form.body_html}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
              rows={5}
              className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm'
              placeholder='Notice body'
            />
            <input
              type='text'
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className='w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm'
              placeholder='Optional link'
            />
            <button
              type='button'
              onClick={() => void handleCreate()}
              disabled={submitting}
              className='w-fit rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest disabled:opacity-60'
            >
              {submitting ? 'Posting...' : 'Post Notice'}
            </button>
          </div>
        </Card>

        {loading ? (
          <div className='py-20 text-center'>
            <p className='text-gray-500'>Loading notices...</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-3'>
            {paginatedNotices.map((n) => (
              <Card key={n.id} className='p-5 transition-shadow hover:shadow-sm'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3'>
                    <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10'>
                      <Megaphone className='h-4 w-4 text-gold' />
                    </span>
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>{n.title}</p>
                      <div className='mt-1 flex items-center gap-2'>
                        <span className='rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold capitalize text-brand'>
                          {n.audience}
                        </span>
                        <span className='text-xs text-gray-400'>{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type='button'
                    disabled={deletingId === n.id}
                    onClick={() => void handleDelete(n.id)}
                    className='text-xs text-red-400 hover:text-red-600 disabled:opacity-50'
                  >
                    {deletingId === n.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                <p className='mt-2 line-clamp-2 text-xs text-gray-500'>
                  {String(n.body_html || '').replace(/<[^>]*>/g, '')}
                </p>
              </Card>
            ))}
          </div>
        )}
        {!loading && notices.length > 0 ? (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-gray-500'>
              Page {page} of {totalPages}
            </p>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Previous
              </button>
              <button
                type='button'
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
