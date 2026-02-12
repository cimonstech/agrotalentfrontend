'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

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
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    body_html: '',
    link: '',
    audience: 'all'
  })
  const [attachments, setAttachments] = useState<{ url: string; file_name: string }[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminNotices()
      setNotices(data.notices || [])
    } catch (e) {
      console.error('Failed to fetch notices:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingImage(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        const result = await apiClient.uploadNoticeImage(file)
        setAttachments((prev) => [...prev, { url: result.url, file_name: result.file_name }])
      }
    } catch (err: any) {
      setError(err?.message || 'Image upload failed')
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
      const data = await apiClient.createNotice({
        title: form.title.trim(),
        body_html: form.body_html.trim(),
        link: form.link.trim() || undefined,
        audience: form.audience,
        attachments: attachments.length ? attachments : undefined
      })
      const msg = (data as any).message
      if (msg) alert(msg)
      setShowCreateModal(false)
      setForm({ title: '', body_html: '', link: '', audience: 'all' })
      setAttachments([])
      fetchNotices()
    } catch (e: any) {
      setError(e?.message || 'Failed to create notice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notices</h1>
            <p className="text-gray-600 dark:text-gray-400">Post announcements for users. They appear in their Notifications page and are sent by email to the selected audience. Admins are not recipients.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <i className="fas fa-bullhorn mr-2"></i>
            Create Notice
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading notices...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {notices.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No notices yet. Create one to notify users.
                      </td>
                    </tr>
                  ) : (
                    notices.map((n) => (
                      <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {n.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
                            {n.audience}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-background-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Notice</h2>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    placeholder="Notice title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                  >
                    <option value="all">All users (graduates, farms, students)</option>
                    <option value="graduate">Graduates only</option>
                    <option value="farm">Farms only</option>
                    <option value="student">Students only</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body (HTML allowed)</label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, body_html: plainTextToHtml(f.body_html || '') }))}
                      className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                    >
                      Format plain text → HTML
                    </button>
                  </div>
                  <textarea
                    value={form.body_html}
                    onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Paste plain text here, then click “Format plain text → HTML” to get paragraphs and bullet lists. Or type HTML: &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;&lt;li&gt;</p>"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tip: Paste your text, then click “Format plain text → HTML”. Lines starting with - or • become bullet lists; double newlines become paragraphs; **text** becomes bold.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pictures (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    disabled={uploadingImage}
                    onChange={handleImageSelect}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                  />
                  {uploadingImage && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
                  {attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((att, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={att.url}
                            alt={att.file_name}
                            className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Optional link (e.g. /dashboard/training)</label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
                    placeholder="/dashboard/training"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => { setShowCreateModal(false); setError(''); setAttachments([]); }}
                    className="px-5 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Creating...' : 'Create & Notify'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
