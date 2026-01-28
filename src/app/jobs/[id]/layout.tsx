import type { Metadata } from 'next'
import { siteConfig, allKeywords } from '@/lib/seo'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real implementation, you'd fetch the job data here
  // For now, we'll use generic metadata
  return {
    title: `Agricultural Job Opportunity in Ghana | AgroTalent Hub`,
    description: `Find agricultural and farming job opportunities across Ghana. Browse verified job listings in crop farming, livestock, agribusiness, and agricultural management.`,
    keywords: [
      ...allKeywords,
      'agricultural job listings',
      'farming job opportunities Ghana',
      'agricultural careers',
    ],
    openGraph: {
      title: `Agricultural Job Opportunity in Ghana | AgroTalent Hub`,
      description: `Find agricultural and farming job opportunities across Ghana.`,
      url: `${siteConfig.url}/jobs/${params.id}`,
    },
    alternates: {
      canonical: `/jobs/${params.id}`,
    },
  }
}

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
