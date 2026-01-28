import type { Metadata } from 'next'
import { siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Sign In - AgroTalent Hub',
  description: 'Sign in to your AgroTalent Hub account to access job opportunities, manage your profile, and connect with farms across Ghana.',
  keywords: ['sign in', 'login', 'AgroTalent Hub'],
  openGraph: {
    title: 'Sign In - AgroTalent Hub',
    description: 'Sign in to your AgroTalent Hub account.',
    url: `${siteConfig.url}/signin`,
  },
  alternates: {
    canonical: '/signin',
  },
  robots: {
    index: false, // Don't index login pages
    follow: true,
  },
}

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
