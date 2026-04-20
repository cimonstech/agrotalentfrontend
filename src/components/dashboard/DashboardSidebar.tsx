'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, memo, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  FileText,
  UserCheck,
  GraduationCap,
  Megaphone,
  CreditCard,
  Send,
  BarChart2,
  MapPin,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { getInitials } from '@/lib/utils'
import { isDashboardNavActive } from '@/lib/dashboard-nav'

const supabase = createSupabaseClient()

type NavItem = { href: string; label: string; icon: string }

type SubMenuGroup = {
  label: string
  icon: string
  submenu: NavItem[]
}

type MenuEntry = NavItem | SubMenuGroup

type MenuItemsByRole = Record<
  'graduate' | 'skilled' | 'farm' | 'admin' | 'student',
  MenuEntry[]
>

interface DashboardSidebarProps {
  role: string
  profile: Profile | null
  unreadNotificationCount?: number
}

type AdminNavLink = {
  href: string
  label: string
  icon: LucideIcon
}

type AdminNavSection = { title: string; links: AdminNavLink[] }

const ADMIN_NAV: AdminNavSection[] = [
  {
    title: 'OVERVIEW',
    links: [
      { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'USERS',
    links: [
      { href: '/dashboard/admin/users', label: 'All Users', icon: Users },
      {
        href: '/dashboard/admin/verification',
        label: 'Verification',
        icon: ShieldCheck,
      },
      { href: '/dashboard/admin/farms', label: 'Farms', icon: Building2 },
    ],
  },
  {
    title: 'RECRUITMENT',
    links: [
      { href: '/dashboard/admin/jobs', label: 'Jobs', icon: Briefcase },
      {
        href: '/dashboard/admin/applications',
        label: 'Applications',
        icon: FileText,
      },
      {
        href: '/dashboard/admin/placements',
        label: 'Placements',
        icon: UserCheck,
      },
    ],
  },
  {
    title: 'OPERATIONS',
    links: [
      {
        href: '/dashboard/admin/training',
        label: 'Training',
        icon: GraduationCap,
      },
      { href: '/dashboard/admin/notices', label: 'Notices', icon: Megaphone },
      {
        href: '/dashboard/admin/payments',
        label: 'Payments',
        icon: CreditCard,
      },
      {
        href: '/dashboard/admin/communications',
        label: 'Communications',
        icon: Send,
      },
    ],
  },
  {
    title: 'ANALYTICS',
    links: [
      { href: '/dashboard/admin/reports', label: 'Reports', icon: BarChart2 },
      { href: '/dashboard/admin/regions', label: 'Regions', icon: MapPin },
    ],
  },
  {
    title: 'SYSTEM',
    links: [
      {
        href: '/dashboard/admin/settings',
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
]

function AdminSidebarPanel({
  profile,
  pendingVerificationCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSignOut,
}: {
  profile: Profile | null
  pendingVerificationCount: number
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  onSignOut: () => void
}) {
  const pathname = usePathname()

  const isActive = (href: string) => isDashboardNavActive(pathname, href)

  const displayName =
    profile?.full_name?.trim() || profile?.email?.trim() || 'Admin'

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        <i
          className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'} text-gray-700`}
        />
      </button>

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-gray-100 bg-white
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:static lg:z-0 lg:flex-shrink-0
        `}
      >
        <div className="border-b border-gray-100 p-5">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/agrotalent-logo.webp"
              alt=""
              width={32}
              height={32}
            />
            <span className="text-base font-bold text-forest">
              AgroTalent Hub
            </span>
          </Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Admin Portal
          </p>
        </div>

        <div className="mx-3 my-3 rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {displayName}
              </p>
              <p className="truncate text-xs text-gray-400">
                {profile?.email ?? ''}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-2">
          {ADMIN_NAV.map((section, sIdx) => (
            <div key={section.title}>
              <p
                className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${
                  sIdx === 0 ? 'pt-2' : 'pt-5'
                }`}
              >
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.links.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  const badge =
                    item.href === '/dashboard/admin/verification'
                      ? pendingVerificationCount
                      : 0
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? 'bg-brand/10 font-semibold text-brand'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="flex-1 text-left">{item.label}</span>
                        {badge > 0 ? (
                          <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}
    </>
  )
}

export const DashboardSidebar = memo(function DashboardSidebar({
  role,
  profile,
  unreadNotificationCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0)
  const roleDisplay =
    role === 'farm'
      ? 'Employer/Farm'
      : role === 'skilled'
        ? 'Skilled Worker'
        : role

  useEffect(() => {
    if (role !== 'admin') return
    let cancelled = false

    const handleVerified = () => {
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .neq('role', 'admin')
        .then(({ count }) => {
          if (!cancelled) setPendingVerificationCount(count ?? 0)
        })
    }

    ;(async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .neq('role', 'admin')
      if (!cancelled) setPendingVerificationCount(count ?? 0)
    })()

    window.addEventListener('profile-verified', handleVerified)
    return () => {
      cancelled = true
      window.removeEventListener('profile-verified', handleVerified)
    }
  }, [role])

  const handleSignOut = () => {
    router.push('/signin')
    router.refresh()
    supabase.auth.signOut().catch((error: unknown) => {
      const isAbort =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          /signal is aborted|aborted without reason/i.test(error.message))
      if (!isAbort) console.error('Sign out error:', error)
    })
  }

  const isActive = (path: string) => isDashboardNavActive(pathname, path)

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isSubmenuActive = (subItems: NavItem[]) => {
    return subItems.some((sub) => isActive(sub.href))
  }

  const menuItems: MenuItemsByRole = {
    graduate: [
      { href: '/dashboard/graduate', label: 'Dashboard', icon: 'home' },
      {
        href: '/dashboard/graduate/applications',
        label: 'My Applications',
        icon: 'file-alt',
      },
      { href: '/dashboard/graduate/jobs', label: 'Browse Jobs', icon: 'search' },
      {
        href: '/dashboard/graduate/documents',
        label: 'My Documents',
        icon: 'file-upload',
      },
      { href: '/dashboard/graduate/messages', label: 'Messages', icon: 'envelope' },
      {
        href: '/dashboard/graduate/notifications',
        label: 'Notifications',
        icon: 'bell',
      },
      {
        href: '/dashboard/graduate/training',
        label: 'Training',
        icon: 'chalkboard-teacher',
      },
      { href: '/dashboard/graduate/profile', label: 'Profile', icon: 'user-cog' },
    ],
    skilled: [
      { href: '/dashboard/skilled', label: 'Dashboard', icon: 'home' },
      {
        href: '/dashboard/skilled/applications',
        label: 'My Applications',
        icon: 'file-alt',
      },
      { href: '/dashboard/skilled/jobs', label: 'Browse Jobs', icon: 'search' },
      { href: '/dashboard/skilled/messages', label: 'Messages', icon: 'envelope' },
      {
        href: '/dashboard/skilled/notifications',
        label: 'Notifications',
        icon: 'bell',
      },
      {
        href: '/dashboard/skilled/training',
        label: 'Training',
        icon: 'chalkboard-teacher',
      },
      { href: '/dashboard/skilled/profile', label: 'Profile', icon: 'user-cog' },
    ],
    farm: [
      { href: '/dashboard/farm', label: 'Dashboard', icon: 'home' },
      { href: '/dashboard/farm/jobs/new', label: 'Post Job', icon: 'plus-circle' },
      {
        href: '/dashboard/farm/applications',
        label: 'Applications',
        icon: 'file-alt',
      },
      { href: '/dashboard/farm/applicants', label: 'Applicants', icon: 'users' },
      { href: '/dashboard/farm/placements', label: 'Placements', icon: 'handshake' },
      { href: '/dashboard/farm/messages', label: 'Messages', icon: 'envelope' },
      {
        href: '/dashboard/farm/notifications',
        label: 'Notifications',
        icon: 'bell',
      },
      {
        href: '/dashboard/farm/training',
        label: 'Training',
        icon: 'chalkboard-teacher',
      },
      { href: '/dashboard/farm/profile', label: 'Profile', icon: 'user-cog' },
    ],
    admin: [],
    student: [
      { href: '/dashboard/student', label: 'Dashboard', icon: 'home' },
      {
        href: '/dashboard/student/profile',
        label: 'Profile',
        icon: 'user-cog',
      },
      { href: '/dashboard/student/jobs', label: 'Browse Jobs', icon: 'search' },
      {
        href: '/dashboard/student/training',
        label: 'Training',
        icon: 'chalkboard-teacher',
      },
      {
        href: '/dashboard/student/notifications',
        label: 'Notifications',
        icon: 'bell',
      },
      { href: '/dashboard/student/notices', label: 'Notices', icon: 'bullhorn' },
    ],
  }

  const items =
    menuItems[role as keyof MenuItemsByRole] ?? menuItems.graduate

  if (role === 'admin') {
    return (
      <AdminSidebarPanel
        profile={profile}
        pendingVerificationCount={pendingVerificationCount}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-background-dark lg:hidden"
      >
        <i
          className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'} text-gray-700 dark:text-white`}
        />
      </button>

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white
          dark:border-white/10 dark:bg-background-dark
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:static lg:z-0
        `}
      >
        <div className="border-b border-gray-200 p-6 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="h-8 w-8" />
            <div>
              <h2 className="text-lg font-bold text-[#101914] dark:text-white">
                AgroTalent Hub
              </h2>
              <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                {roleDisplay} Dashboard
              </p>
            </div>
          </Link>
        </div>

        <div className="border-b border-gray-200 p-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                role === 'skilled' ? 'bg-accent/10' : 'bg-primary/10'
              }`}
            >
              <i
                className={`fas fa-user ${
                  role === 'skilled' ? 'text-accent' : 'text-primary'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {profile?.full_name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {profile?.email || ''}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {items.map((item, index) => {
              if ('submenu' in item) {
                const submenuKey = `submenu-${index}`
                const isOpen =
                  openSubmenus[submenuKey] ?? isSubmenuActive(item.submenu)
                const hasActiveChild = isSubmenuActive(item.submenu)

                return (
                  <li key={submenuKey}>
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(submenuKey)}
                      className={`
                        flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 transition-colors
                        ${
                          hasActiveChild
                            ? role === 'skilled'
                              ? 'border-l-4 border-accent bg-accent/10 text-accent'
                              : 'border-l-4 border-primary bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fas fa-${item.icon} w-5`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <i
                        className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs transition-transform`}
                      />
                    </button>
                    {isOpen ? (
                      <ul className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4 dark:border-white/10">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors
                                ${
                                  isActive(subItem.href)
                                    ? role === 'skilled'
                                      ? 'bg-accent/10 font-medium text-accent'
                                      : 'bg-primary/10 font-medium text-primary'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                                }
                              `}
                            >
                              <i className={`fas fa-${subItem.icon} w-4`} />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              }

              const showNotificationBadge =
                item.href?.includes('/notifications') &&
                unreadNotificationCount > 0
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-lg px-4 py-3 transition-colors
                      ${
                        isActive(item.href)
                          ? role === 'skilled'
                            ? 'border-l-4 border-accent bg-accent/10 text-accent'
                            : 'border-l-4 border-primary bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <i className={`fas fa-${item.icon} w-5`} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {showNotificationBadge ? (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white dark:bg-primary dark:text-white">
                        {unreadNotificationCount > 99
                          ? '99+'
                          : unreadNotificationCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <i className="fas fa-sign-out-alt w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}
    </>
  )
})
