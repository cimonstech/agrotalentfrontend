'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Document } from '@/types'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Pill, StatusBadge } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

const DOC_TYPES: { value: string; label: string; hint: string }[] = [
  {
    value: 'certificate',
    label: 'Certificate',
    hint: 'Degree or programme certificate (PDF or image).',
  },
  {
    value: 'transcript',
    label: 'Transcript',
    hint: 'Official academic transcript.',
  },
  { value: 'cv', label: 'CV / Résumé', hint: 'Up-to-date CV in PDF format preferred.' },
  {
    value: 'nss_letter',
    label: 'NSS letter',
    hint: 'NSS posting or related letter from your institution.',
  },
  {
    value: 'other',
    label: 'Other',
    hint: 'Not uploaded via this form — contact support if you need this.',
  },
]

const API_TYPES = new Set(['certificate', 'transcript', 'cv', 'nss_letter'])

const ACCEPT = '.pdf,.jpg,.jpeg,.png'
const ACCEPT_LABEL = 'PDF, JPG, or PNG · max practical size ~10MB'

function formatFileSize(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-1/3 rounded-lg bg-gray-200" />
      <div className="mt-3 h-4 w-2/3 rounded-lg bg-gray-200" />
    </div>
  )
}

type DocumentsManagerProps = {
  /** Shown in the hero line under the title (e.g. graduate vs skilled). */
  audienceLine?: string
}

export function DocumentsManager({
  audienceLine = 'Upload certificates and supporting files for admin verification.',
}: DocumentsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [docType, setDocType] = useState('certificate')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle')
  const [uploadMsg, setUploadMsg] = useState('')
  const [fileTouched, setFileTouched] = useState(false)

  const selectedHint =
    DOC_TYPES.find((t) => t.value === docType)?.hint ?? ''
  const canUploadType = API_TYPES.has(docType)
  const fileError =
    fileTouched && !file ? 'Choose a file to upload.' : ''
  const typeError =
    !canUploadType && docType === 'other'
      ? 'Use certificate, transcript, CV, or NSS letter for uploads here.'
      : ''

  const load = useCallback(async () => {
    setListError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setListError('You must be signed in.')
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
      setListError(qErr.message)
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

  function pickFile(next: File | null) {
    setFile(next)
    setUploadState('idle')
    setUploadMsg('')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
    setFileTouched(true)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setFileTouched(true)
    if (!file) {
      setUploadState('error')
      setUploadMsg('Choose a file first.')
      return
    }
    if (!API_TYPES.has(docType)) {
      setUploadState('error')
      setUploadMsg(
        'This form accepts certificate, transcript, CV, and NSS letter only. Pick one of those types, or contact support for other documents.'
      )
      return
    }
    setUploadState('uploading')
    setUploadMsg('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setUploadState('error')
      setUploadMsg('Not signed in.')
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
      setUploadMsg((json as { error?: string }).error ?? 'Upload failed.')
      return
    }
    const url = (json as { url?: string }).url
    if (!url) {
      setUploadState('error')
      setUploadMsg('No file URL returned.')
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
    setUploadMsg('Your file was uploaded and is pending review.')
    pickFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await load()
  }

  async function handleDelete(id: string) {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this document from your list?')
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
      setListError(delErr.message)
      return
    }
    await load()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:max-w-4xl lg:px-8 lg:py-10">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Documents
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                My documents
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
                {audienceLine}
              </p>
            </div>
            {!loading ? (
              <div
                className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm"
                role="status"
                aria-live="polite"
              >
                <span className="text-gray-500">On file</span>
                <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-sm font-bold text-forest">
                  {rows.length}
                </span>
              </div>
            ) : null}
          </div>
        </header>

        {listError ? (
          <div
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {listError}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <Card className="lg:col-span-3" padding="lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <FileUp className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload a document
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Admins review uploads before they count toward verification.
                </p>
              </div>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => void handleUpload(e)}
            >
              <Select
                label="Document type"
                options={DOC_TYPES.map(({ value, label }) => ({ value, label }))}
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value)
                  setUploadState('idle')
                  setUploadMsg('')
                }}
              />
              {selectedHint ? (
                <p className="-mt-2 text-xs text-gray-500">{selectedHint}</p>
              ) : null}
              {typeError ? (
                <p className="text-sm text-amber-800">{typeError}</p>
              ) : null}

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  File
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  className={cn(
                    'rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                    dragActive
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-200 bg-gray-50/80 hover:border-gray-300'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    aria-label="Choose file"
                    onChange={(e) => {
                      pickFile(e.target.files?.[0] ?? null)
                      setFileTouched(true)
                    }}
                  />
                  <FileUp className="mx-auto h-10 w-10 text-gray-400" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-gray-800">
                    Drag a file here, or{' '}
                    <button
                      type="button"
                      className="font-semibold text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{ACCEPT_LABEL}</p>
                </div>
                {file ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                        {getInitials(file.name.replace(/\.[^.]+$/, ''))}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      aria-label="Remove file"
                      onClick={() => {
                        pickFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                {fileError ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {fileError}
                  </p>
                ) : null}
              </div>

              {uploadState === 'uploading' ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                  Uploading… please keep this tab open.
                </div>
              ) : null}
              {uploadState === 'success' ? (
                <div
                  className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{uploadMsg}</span>
                </div>
              ) : null}
              {uploadState === 'error' ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {uploadMsg}
                </div>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                disabled={
                  uploadState === 'uploading' || !file || !canUploadType
                }
                className="w-full sm:w-auto"
              >
                {uploadState === 'uploading' ? 'Uploading…' : 'Upload document'}
              </Button>
              {!file || !canUploadType ? (
                <p className="text-xs text-gray-500">
                  {!canUploadType
                    ? 'Choose a supported document type to enable upload.'
                    : 'Select a file to enable upload.'}
                </p>
              ) : null}
            </form>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card padding="lg" className="border-brand/10 bg-brand/[0.04]">
              <h3 className="text-sm font-semibold text-forest">
                Before you upload
              </h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-gray-700">
                <li>Use clear scans or exports — blurry files may be rejected.</li>
                <li>
                  Filenames can be anything; type is set from the dropdown above.
                </li>
                <li>
                  Status moves from <strong>pending</strong> to approved or
                  rejected after review.
                </li>
              </ul>
            </Card>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="doc-list-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="doc-list-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Your uploads
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((k) => (
                <CardSkeleton key={k} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Card
              padding="lg"
              className="border-dashed border-gray-200 bg-gray-50/50"
            >
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  <FileText className="h-7 w-7 text-gray-400" aria-hidden />
                </div>
                <p className="mt-4 text-base font-semibold text-gray-900">
                  No documents yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-gray-600">
                  When you upload a file, it will appear here with status and
                  actions.
                </p>
              </div>
            </Card>
          ) : (
            <ul className="space-y-4">
              {rows.map((d) => (
                <li key={d.id}>
                  <Card padding="md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {d.file_name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill variant="gray">{d.document_type}</Pill>
                          <StatusBadge status={d.status} />
                          <span className="text-xs text-gray-500">
                            {formatFileSize(d.file_size)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Uploaded{' '}
                          {formatDate(d.uploaded_at ?? d.created_at)}
                        </p>
                        {d.status === 'rejected' && d.rejection_reason ? (
                          <div
                            className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-900"
                            role="alert"
                          >
                            <span className="font-medium">Reason: </span>
                            {d.rejection_reason}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="inline-flex items-center gap-1.5"
                          onClick={() => void handleDelete(d.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default DocumentsManager
