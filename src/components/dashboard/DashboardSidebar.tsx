'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { memo, useEffect, useMemo, useState } from 'react'
import {
  BarChart2,
  Bell,
  Briefcase,
  Building2,
  Circle,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  PlusCircle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  UserCheck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { getInitials } from '@/lib/utils'
import { isDashboardNavActive } from '@/lib/dashboard-nav'
import { cn } from '@/lib/utils'

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

type MiniStat = {
  label: string
  value: number
}

const ICON_MAP: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  'file-alt': FileText,
  search: Search,
  'file-upload': Upload,
  envelope: Mail,
  bell: Bell,
  'chalkboard-teacher': GraduationCap,
  'user-cog': UserCog,
  'plus-circle': PlusCircle,
  users: Users,
  handshake: Handshake,
  bullhorn: Megaphone,
}

const ADMIN_NAV: AdminNavSection[] = [
  {
    title: 'OVERVIEW',
    links: [{ href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'USERS',
    links: [
      { href: '/dashboard/admin/users', label: 'All Users', icon: Users },
      { href: '/dashboard/admin/verification', label: 'Verification', icon: ShieldCheck },
      { href: '/dashboard/admin/farms', label: 'Farms', icon: Building2 },
    ],
  },
  {
    title: 'RECRUITMENT',
    links: [
      { href: '/dashboard/admin/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/dashboard/admin/applications', label: 'Applications', icon: FileText },
      { href: '/dashboard/admin/placements', label: 'Placements', icon: UserCheck },
    ],
  },
  {
    title: 'OPERATIONS',
    links: [
      { href: '/dashboard/admin/training', label: 'Training', icon: GraduationCap },
      { href: '/dashboard/admin/notices', label: 'Notices', icon: Megaphone },
      { href: '/dashboard/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/dashboard/admin/communications', label: 'Communications', icon: Send },
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
    links: [{ href: '/dashboard/admin/settings', label: 'Settings', icon: Settings }],
  },
]

const menuItems: MenuItemsByRole = {
  graduate: [
    { href: '/dashboard/graduate', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/graduate/applications', label: 'My Applications', icon: 'file-alt' },
    { href: '/dashboard/graduate/jobs', label: 'Browse Jobs', icon: 'search' },
    { href: '/dashboard/graduate/documents', label: 'My Documents', icon: 'file-upload' },
    { href: '/dashboard/graduate/messages', label: 'Messages', icon: 'envelope' },
    { href: '/dashboard/graduate/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/graduate/training', label: 'Training', icon: 'chalkboard-teacher' },
    { href: '/dashboard/graduate/profile', label: 'Profile', icon: 'user-cog' },
  ],
  skilled: [
    { href: '/dashboard/skilled', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/skilled/applications', label: 'My Applications', icon: 'file-alt' },
    { href: '/dashboard/skilled/jobs', label: 'Browse Jobs', icon: 'search' },
    { href: '/dashboard/skilled/messages', label: 'Messages', icon: 'envelope' },
    { href: '/dashboard/skilled/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/skilled/training', label: 'Training', icon: 'chalkboard-teacher' },
    { href: '/dashboard/skilled/profile', label: 'Profile', icon: 'user-cog' },
  ],
  farm: [
    { href: '/dashboard/farm', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/farm/jobs/new', label: 'Post Job', icon: 'plus-circle' },
    { href: '/dashboard/farm/applications', label: 'Applications', icon: 'file-alt' },
    { href: '/dashboard/farm/applicants', label: 'Applicants', icon: 'users' },
    { href: '/dashboard/farm/placements', label: 'Placements', icon: 'handshake' },
    { href: '/dashboard/farm/messages', label: 'Messages', icon: 'envelope' },
    { href: '/dashboard/farm/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/farm/training', label: 'Training', icon: 'chalkboard-teacher' },
    { href: '/dashboard/farm/profile', label: 'Profile', icon: 'user-cog' },
  ],
  admin: [],
  student: [
    { href: '/dashboard/student', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/student/applications', label: 'My Applications', icon: 'file-alt' },
    { href: '/dashboard/student/jobs', label: 'Browse Jobs', icon: 'search' },
    { href: '/dashboard/student/documents', label: 'My Documents', icon: 'file-upload' },
    { href: '/dashboard/student/messages', label: 'Messages', icon: 'envelope' },
    { href: '/dashboard/student/training', label: 'Training', icon: 'chalkboard-teacher' },
    { href: '/dashboard/student/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/student/notices', label: 'Notices', icon: 'bullhorn' },
    { href: '/dashboard/student/profile', label: 'Profile', icon: 'user-cog' },
  ],
}

function roleLabel(role: string): string {
  if (role === 'farm') return 'Farm'
  if (role === 'skilled') return 'Skilled Worker'
  if (role === 'student') return 'Student'
  if (role === 'admin') return 'Administrator'
  return 'Graduate'
}

function SidebarItem({
  href,
  label,
  icon,
  active,
  badge,
  onNavigate,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: number
  onNavigate: () => void
}) {
  const Icon = icon
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
        active
          ? 'border-l-2 border-brand bg-brand/10 font-semibold text-brand'
          : 'border-l-2 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      )}
    >
      <Icon className='h-4 w-4 flex-shrink-0' aria-hidden />
      <span className='flex-1'>{label}</span>
      {badge && badge > 0 ? (
        <span className='ml-auto rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white'>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  )
}

function UserCard({
  profile,
  role,
  miniStats,
}: {
  profile: Profile | null
  role: string
  miniStats: MiniStat[]
}) {
  const displayName =
    profile?.full_name?.trim() || profile?.farm_name?.trim() || profile?.email?.trim() || 'User'
  return (
    <div className='relative mx-3 my-3 overflow-hidden rounded-2xl'>
      <div className='absolute inset-0'>
        <Image src='/farm_image_header.webp' alt='' fill className='object-cover object-center' sizes='220px' />
        <div className='absolute inset-0 bg-forest/75' />
      </div>
      <div className='relative z-10 p-4 backdrop-blur-sm'>
        <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-base font-bold text-white'>
          {getInitials(displayName)}
        </div>
        <p className='truncate text-sm font-bold text-white'>{displayName}</p>
        <p className='mt-0.5 text-xs text-white/70'>{roleLabel(role)}</p>
        {miniStats.length > 0 ? (
          <div className='mt-3 flex gap-2'>
            {miniStats.map((stat) => (
              <div key={stat.label} className='flex-1 rounded-xl bg-white/20 p-2 text-center backdrop-blur-sm'>
                <p className='text-sm font-bold text-white'>{stat.value}</p>
                <p className='mt-0.5 text-[9px] text-white/60'>{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SectionLabel({ text, topPad = true }: { text: string; topPad?: boolean }) {
  return (
    <p
      className={cn(
        'px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400',
        topPad ? 'pt-4' : 'pt-1'
      )}
    >
      {text}
    </p>
  )
}

function AdminSidebarPanel({
  profile,
  pendingVerificationCount,
  miniStats,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSignOut,
}: {
  profile: Profile | null
  pendingVerificationCount: number
  miniStats: MiniStat[]
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  onSignOut: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      <button
        type='button'
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className='fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm lg:hidden'
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <X className='h-5 w-5 text-gray-800' aria-hidden />
        ) : (
          <Menu className='h-5 w-5 text-gray-800' aria-hidden />
        )}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-hidden border-r border-gray-100 bg-white',
          'transform transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          mobileMenuOpen ? 'shadow-2xl' : '',
          'lg:sticky lg:top-0 lg:z-0'
        )}
      >
        <div className='border-b border-gray-100 p-4'>
          <Link href='/' className='flex items-center gap-2' onClick={() => setMobileMenuOpen(false)}>
            <Image src='/agrotalent-logo.webp' alt='' width={28} height={28} />
            <span className='font-ubuntu text-sm font-bold text-forest'>AgroTalent Hub</span>
          </Link>
        </div>

        <UserCard role='admin' profile={profile} miniStats={miniStats} />

        <nav className='flex-1 overflow-y-auto px-3 py-2'>
          {ADMIN_NAV.map((section, idx) => (
            <div key={section.title}>
              <SectionLabel text={section.title} topPad={idx > 0} />
              <ul className='space-y-1'>
                {section.links.map((item) => (
                  <li key={item.href}>
                    <SidebarItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isDashboardNavActive(pathname, item.href)}
                      badge={item.href === '/dashboard/admin/verification' ? pendingVerificationCount : undefined}
                      onNavigate={() => setMobileMenuOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className='mt-auto border-t border-gray-100 bg-white p-3'>
          <button
            type='button'
            onClick={onSignOut}
            className='flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50'
          >
            <LogOut className='h-4 w-4' aria-hidden />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className='fixed inset-0 z-30 bg-black/50 lg:hidden' role='presentation' onClick={() => setMobileMenuOpen(false)} />
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
  const [miniStats, setMiniStats] = useState<MiniStat[]>([])

  const items = useMemo(() => {
    const key = role as keyof MenuItemsByRole
    return menuItems[key] ?? menuItems.graduate
  }, [role])

  useEffect(() => {
    if (!profile?.id) {
      setMiniStats([])
      return
    }
    let cancelled = false

    const loadStats = async () => {
      try {
        if (role === 'graduate' || role === 'skilled') {
          const [appsRes, placementRes] = await Promise.all([
            supabase.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', profile.id),
            supabase.from('placements').select('id', { count: 'exact', head: true }).eq('graduate_id', profile.id),
          ])
          if (!cancelled) {
            setMiniStats([
              { label: 'Applications', value: appsRes.count ?? 0 },
              { label: 'Placements', value: placementRes.count ?? 0 },
            ])
          }
          return
        }

        if (role === 'farm') {
          const jobsRes = await supabase.from('jobs').select('id', { count: 'exact', head: false }).eq('farm_id', profile.id)
          const jobRows = (jobsRes.data as { id: string }[] | null) ?? []
          let appCount = 0
          if (jobRows.length > 0) {
            const ids = jobRows.map((r) => r.id)
            const appsRes = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('job_id', ids)
            appCount = appsRes.count ?? 0
          }
          if (!cancelled) {
            setMiniStats([
              { label: 'Jobs', value: jobsRes.count ?? jobRows.length },
              { label: 'Applications', value: appCount },
            ])
          }
          return
        }

        if (role === 'student') {
          const trainingRes = await supabase
            .from('training_participants')
            .select('id', { count: 'exact', head: true })
            .eq('participant_id', profile.id)
          if (!cancelled) {
            setMiniStats([{ label: 'Training', value: trainingRes.count ?? 0 }])
          }
          return
        }

        if (role === 'admin') {
          const [usersRes, pendingRes] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false).neq('role', 'admin'),
          ])
          if (!cancelled) {
            const pending = pendingRes.count ?? 0
            setPendingVerificationCount(pending)
            setMiniStats([
              { label: 'Users', value: usersRes.count ?? 0 },
              { label: 'Pending', value: pending },
            ])
          }
          return
        }

        if (!cancelled) setMiniStats([])
      } catch {
        if (!cancelled) setMiniStats([])
      }
    }

    void loadStats()
    return () => {
      cancelled = true
    }
  }, [role, profile?.id])

  useEffect(() => {
    if (role !== 'admin') return
    const handleVerified = () => {
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', false)
        .neq('role', 'admin')
        .then(({ count }) => setPendingVerificationCount(count ?? 0))
    }
    window.addEventListener('profile-verified', handleVerified)
    return () => window.removeEventListener('profile-verified', handleVerified)
  }, [role])

  const handleSignOut = () => {
    router.push('/signin')
    router.refresh()
    supabase.auth.signOut().catch((error: unknown) => {
      const isAbort =
        error instanceof Error &&
        (error.name === 'AbortError' || /signal is aborted|aborted without reason/i.test(error.message))
      if (!isAbort) console.error('Sign out error:', error)
    })
  }

  const isActive = (path: string) => isDashboardNavActive(pathname, path)

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isSubmenuActive = (subItems: NavItem[]) => subItems.some((sub) => isActive(sub.href))

  if (role === 'admin') {
    return (
      <AdminSidebarPanel
        profile={profile}
        pendingVerificationCount={pendingVerificationCount}
        miniStats={miniStats}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
    )
  }

  const displayName =
    profile?.full_name?.trim() || profile?.farm_name?.trim() || profile?.email?.trim() || 'User'

  return (
    <>
      <button
        type='button'
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className='fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm lg:hidden'
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <X className='h-5 w-5 text-gray-800' aria-hidden />
        ) : (
          <Menu className='h-5 w-5 text-gray-800' aria-hidden />
        )}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-hidden border-r border-gray-100 bg-white',
          'transform transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          mobileMenuOpen ? 'shadow-2xl' : '',
          'lg:sticky lg:top-0 lg:z-0'
        )}
      >
        <div className='border-b border-gray-100 p-4'>
          <Link href='/' className='flex items-center gap-2' onClick={() => setMobileMenuOpen(false)}>
            <Image src='/agrotalent-logo.webp' alt='' width={28} height={28} />
            <span className='font-ubuntu text-sm font-bold text-forest'>AgroTalent Hub</span>
          </Link>
        </div>

        <div className='mx-3 my-3 overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-brand p-4'>
          <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-base font-bold text-white'>
            {getInitials(displayName)}
          </div>
          <p className='truncate text-sm font-bold text-white'>{displayName}</p>
          <p className='mt-0.5 text-xs text-white/70'>{roleLabel(role)}</p>
          {miniStats.length > 0 ? (
            <div className='mt-3 flex gap-2'>
              {miniStats.map((stat) => (
                <div key={stat.label} className='flex-1 rounded-xl bg-white/15 p-2 text-center'>
                  <p className='text-sm font-bold text-white'>{stat.value}</p>
                  <p className='mt-0.5 text-[9px] text-white/60'>{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <nav className='flex-1 overflow-y-auto px-3 py-2'>
          <SectionLabel text='NAVIGATION' topPad={false} />
          <ul className='space-y-1'>
            {items.map((entry, index) => {
              if ('submenu' in entry) {
                const submenuKey = `submenu-${index}`
                const isOpen = openSubmenus[submenuKey] ?? isSubmenuActive(entry.submenu)
                const ParentIcon = ICON_MAP[entry.icon] ?? Circle
                return (
                  <li key={submenuKey}>
                    <button
                      type='button'
                      onClick={() => toggleSubmenu(submenuKey)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isSubmenuActive(entry.submenu)
                          ? 'border-l-2 border-brand bg-brand/10 font-semibold text-brand'
                          : 'border-l-2 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      )}
                    >
                      <ParentIcon className='h-4 w-4' aria-hidden />
                      <span className='flex-1 text-left'>{entry.label}</span>
                      <span className='text-xs'>{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen ? (
                      <ul className='mt-1 space-y-1 pl-3'>
                        {entry.submenu.map((subItem) => {
                          const SubIcon = ICON_MAP[subItem.icon] ?? Circle
                          return (
                            <li key={subItem.href}>
                              <SidebarItem
                                href={subItem.href}
                                label={subItem.label}
                                icon={SubIcon}
                                active={isActive(subItem.href)}
                                onNavigate={() => setMobileMenuOpen(false)}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              }

              const Icon = ICON_MAP[entry.icon] ?? Circle
              const showNotificationBadge =
                entry.href.includes('/notifications') && unreadNotificationCount > 0
              return (
                <li key={entry.href}>
                  <SidebarItem
                    href={entry.href}
                    label={entry.label}
                    icon={Icon}
                    active={isActive(entry.href)}
                    badge={showNotificationBadge ? unreadNotificationCount : undefined}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                </li>
              )
            })}
          </ul>
        </nav>

        <div className='mt-auto border-t border-gray-100 bg-white p-3'>
          <button
            type='button'
            onClick={handleSignOut}
            className='flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50'
          >
            <LogOut className='h-4 w-4' aria-hidden />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className='fixed inset-0 z-30 bg-black/50 lg:hidden' role='presentation' onClick={() => setMobileMenuOpen(false)} />
      ) : null}
    </>
  )
})
