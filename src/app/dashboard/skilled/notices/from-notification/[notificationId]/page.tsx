'use client'

import { useParams } from 'next/navigation'
import { NoticeDetail } from '@/components/dashboard/NoticeDetail'

export default function SkilledNoticeFromNotificationPage() {
  const params = useParams()
  const notificationId = params?.notificationId as string
  return <NoticeDetail notificationsPath="/dashboard/skilled/notifications" notificationId={notificationId} />
}
