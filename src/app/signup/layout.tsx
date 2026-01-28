import type { Metadata } from 'next'
import { siteConfig, allKeywords } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Sign Up - Join AgroTalent Hub | Agricultural Jobs in Ghana',
  description: 'Create your account on AgroTalent Hub. Join as a farm/employer, graduate, skilled worker, or student. Connect with agricultural opportunities across all 16 regions of Ghana.',
  keywords: [
    ...allKeywords,
    'sign up',
    'create account',
    'register',
    'agricultural platform registration',
  ],
  openGraph: {
    title: 'Sign Up - Join AgroTalent Hub',
    description: 'Create your account and connect with agricultural opportunities across Ghana.',
    url: `${siteConfig.url}/signup`,
  },
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: false, // Don't index signup pages
    follow: true,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
