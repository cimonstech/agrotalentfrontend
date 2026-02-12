import { redirect } from 'next/navigation'

export default async function StudentNoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/graduate/notices/${id}`)
}
