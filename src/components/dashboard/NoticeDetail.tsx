'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="button"
      tabIndex={-1}
      aria-label="Close image"
    >
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <span className="absolute top-4 right-4 text-white/90 text-sm">Tap to close</span>
    </div>
  )
}

type Notice = {
  id: string
  title: string
  body_html: string
  link?: string
  audience?: string
  attachments?: { url: string; file_name?: string }[]
  created_at: string
}

export function NoticeDetail({ notificationsPath, notificationId }: { notificationsPath: string; notificationId?: string }) {
  const params = useParams()
  const id = (params?.id as string) || undefined
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    const fetchKey = notificationId || id
    if (!fetchKey) return
    let mounted = true
    const fetchFn = notificationId ? apiClient.getNoticeByNotificationId(notificationId) : apiClient.getNotice(id!)
    fetchFn.then((data: any) => {
      if (mounted) setNotice(data)
    }).catch((e: any) => {
      if (mounted) setError(e?.message || 'Failed to load notice')
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [id, notificationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading notice...</p>
        </div>
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Notice not found.'}</p>
          <Link href={notificationsPath} className="text-primary hover:underline">← Back to Notifications</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-8">
        <Link href={notificationsPath} className="text-primary hover:underline mb-4 md:mb-6 inline-block text-sm md:text-base">
          ← Back to Notifications
        </Link>
        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.url}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}
        <article className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-4 sm:p-6 md:p-8">
            <div className="flex-1 min-w-0 order-2 md:order-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">{notice.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
                {new Date(notice.created_at).toLocaleString()}
                {notice.audience && notice.audience !== 'all' && (
                  <span className="ml-2 capitalize"> • {notice.audience}</span>
                )}
              </p>
              <div
                className="notice-body max-w-none text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: notice.body_html }}
              />
              {notice.link && notice.link.trim() && (
                <div className="mt-6">
                  <Link
                    href={notice.link}
                    className="text-primary hover:underline font-medium text-sm sm:text-base"
                  >
                    {notice.link.startsWith('http') ? 'Open link' : 'View more'} →
                  </Link>
                </div>
              )}
            </div>
            {notice.attachments && notice.attachments.length > 0 && (
              <div className="flex-shrink-0 order-1 md:order-2 md:w-80 lg:w-96 md:sticky md:top-8 md:self-start">
                <div className="flex flex-row md:flex-col gap-3 overflow-x-auto pb-2 md:pb-0 md:overflow-visible snap-x md:snap-none">
                  {notice.attachments.map((att: { url: string; file_name?: string }, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxImage({ url: att.url, alt: att.file_name || 'Notice image' })}
                      className="block flex-shrink-0 w-[85vw] max-w-[280px] sm:max-w-[320px] md:w-full md:max-w-none snap-start text-left cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-white/20 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={att.url}
                        alt={att.file_name || 'Notice image'}
                        className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover"
                      />
                      <span className="block py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Tap to view image
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
