import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { BackToTop } from '@/components/layout/BackToTop'

const ubuntu = Ubuntu({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
})

export const metadata: Metadata = {
  title: 'AgroTalent Hub - Connecting Agricultural Talent with Farms in Ghana',
  description: 'A centralized digital system for recruiting, training, and managing qualified agricultural professionals and students, while supporting farms with verified manpower.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={ubuntu.variable}>
      <body className={`${ubuntu.variable} font-sans bg-background-light dark:bg-background-dark text-[#101914] dark:text-white antialiased`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <BackToTop />
      </body>
    </html>
  )
}
