'use client'

import { useParams } from 'next/navigation'
import { NoticeDetail } from '@/components/dashboard/NoticeDetail'

export default function GraduateNoticeFromNotificationPage() {
  const params = useParams()
  const notificationId = params?.notificationId as string
  return <NoticeDetail notificationsPath="/dashboard/graduate/notifications" notificationId={notificationId} />
}
