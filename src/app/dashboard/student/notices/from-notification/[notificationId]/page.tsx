import { redirect } from 'next/navigation'

export default async function StudentNoticeFromNotificationPage({ params }: { params: Promise<{ notificationId: string }> }) {
  const { notificationId } = await params
  redirect(`/dashboard/graduate/notices/from-notification/${notificationId}`)
}
