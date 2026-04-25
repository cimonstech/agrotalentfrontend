'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Bell, FileUp, Shield, User } from 'lucide-react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import { Pill } from '@/components/ui/Badge'

export type ProfileEditorTab = 'details' | 'notifications' | 'account'

const TAB_DEF: {
  id: ProfileEditorTab
  label: string
  icon: typeof User
}[] = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Security', icon: Shield },
]

export interface ProfileEditorShellProps {
  title: string
  subtitle?: string
  verified: boolean | null
  profile: Profile | null
  hasCvDocument: boolean
  hasCertificateDocument?: boolean
  hasSupportingDocuments?: boolean
  documentsHref: string
  details: ReactNode
  notifications: ReactNode
  account: ReactNode
}

export function ProfileEditorShell({
  title,
  subtitle,
  verified,
  profile,
  hasCvDocument,
  hasCertificateDocument,
  hasSupportingDocuments,
  documentsHref,
  details,
  notifications,
  account,
}: ProfileEditorShellProps) {
  const [tab, setTab] = useState<ProfileEditorTab>('details')

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf8_0%,#f3f4f6_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 lg:py-8">
        <header className="flex flex-col gap-4 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 max-w-xl text-sm text-gray-600">
                {subtitle}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {verified ? (
                <Pill variant="green">Verified</Pill>
              ) : (
                <Pill variant="yellow">Pending Verification</Pill>
              )}
            </div>
          </div>
          <Link
            href={documentsHref}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <FileUp className="h-4 w-4" aria-hidden />
            Documents & uploads
          </Link>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {profile ? (
            <aside className="lg:col-span-4">
              <ProfileStrength
                profile={profile}
                hasCvDocument={hasCvDocument}
                hasCertificateDocument={hasCertificateDocument}
                hasSupportingDocuments={hasSupportingDocuments}
                className="shadow-sm"
              />
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                CV and certificates uploaded under{' '}
                <span className="font-medium text-gray-700">
                  Documents & uploads
                </span>{' '}
                count toward your strength score here.
              </p>
            </aside>
          ) : null}

          <div className={profile ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <nav
              className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200/80 bg-white/90 p-1 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Profile sections"
            >
              {TAB_DEF.map(({ id, label, icon: Icon }) => {
                const active = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-initial sm:justify-start sm:px-4',
                      active
                        ? 'bg-brand text-white shadow-md shadow-brand/25'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </nav>

            <div className="mt-5">
              {tab === 'details' ? details : null}
              {tab === 'notifications' ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                  {notifications}
                </div>
              ) : null}
              {tab === 'account' ? (
                <div className="rounded-2xl border border-amber-100/80 bg-amber-50/40 p-5 shadow-sm md:p-6">
                  {account}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
