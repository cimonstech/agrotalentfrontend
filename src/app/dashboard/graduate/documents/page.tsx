'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Document } from '@/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Input'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'cv', label: 'CV' },
  { value: 'nss_letter', label: 'NSS letter' },
  { value: 'other', label: 'Other' },
]

const API_TYPES = new Set(['certificate', 'transcript', 'cv', 'nss_letter'])

function formatFileSize(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '-'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-1/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
    </div>
  )
}

export default function GraduateDocumentsPage() {
  const [rows, setRows] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [docType, setDocType] = useState('certificate')
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle')
  const [uploadMsg, setUploadMsg] = useState('')

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
      .from('documents')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (qErr) {
      setError(qErr.message)
      setRows([])
    } else {
      setRows((data as Document[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setUploadState('error')
      setUploadMsg('Choose a file first')
      return
    }
    if (!API_TYPES.has(docType)) {
      setUploadState('error')
      setUploadMsg(
        'Upload through this form supports certificate, transcript, CV, and NSS letter. For other files, contact support.'
      )
      return
    }
    setUploadState('uploading')
    setUploadMsg('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setUploadState('error')
      setUploadMsg('Not signed in')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', docType)
    const res = await fetch('/api/profile/upload-document', {
      method: 'POST',
      body: formData,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setUploadState('error')
      setUploadMsg((json as { error?: string }).error ?? 'Upload failed')
      return
    }
    const url = (json as { url?: string }).url
    if (!url) {
      setUploadState('error')
      setUploadMsg('No file URL returned')
      return
    }
    const { error: insErr } = await supabase.from('documents').insert({
      user_id: uid,
      document_type: docType,
      file_name: file.name,
      file_url: url,
      file_size: file.size,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    })
    if (insErr) {
      setUploadState('error')
      setUploadMsg(insErr.message)
      return
    }
    setUploadState('success')
    setUploadMsg('Upload completed')
    setFile(null)
    await load()
  }

  async function handleDelete(id: string) {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this document record?')
    ) {
      return
    }
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    const { error: delErr } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', uid)
    if (delErr) {
      setError(delErr.message)
      return
    }
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-gray-600">
            Upload certificates and files for verification
          </p>
        </div>

        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Upload</h2>
          <form className="mt-4 space-y-4" onSubmit={handleUpload}>
            <Select
              label="Document type"
              options={DOC_TYPES}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-800"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {uploadState === 'uploading' ? (
              <p className="text-sm text-gray-600">Uploading...</p>
            ) : null}
            {uploadState === 'success' ? (
              <p className="text-sm text-green-700">{uploadMsg}</p>
            ) : null}
            {uploadState === 'error' ? (
              <p className="text-sm text-red-600">{uploadMsg}</p>
            ) : null}
            <Button type="submit" variant="primary" disabled={uploadState === 'uploading'}>
              Upload
            </Button>
          </form>
        </Card>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((k) => (
              <CardSkeleton key={k} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={<FileText className="mx-auto h-12 w-12" />}
              title="No documents yet"
              description="Upload a file to get started."
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((d) => (
              <li key={d.id}>
                <Card>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{d.file_name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Pill variant="gray">{d.document_type}</Pill>
                        <StatusBadge status={d.status} />
                        <span className="text-xs text-gray-500">
                          {formatFileSize(d.file_size)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Uploaded {formatDate(d.uploaded_at ?? d.created_at)}
                      </p>
                      {d.status === 'rejected' && d.rejection_reason ? (
                        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
                          {d.rejection_reason}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </a>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(d.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
