'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, memo } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

const supabase = createSupabaseClient()

interface DashboardSidebarProps {
  role: string
  profile: any
}

export const DashboardSidebar = memo(function DashboardSidebar({ role, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})
  const roleDisplay = role === 'farm' ? 'Employer/Farm' : role === 'skilled' ? 'Skilled Worker' : role

  const handleSignOut = async () => {
    const signOutWithTimeout = () =>
      Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 1500))
      ])

    try {
      await signOutWithTimeout()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // Redirect immediately regardless of signOut result
      router.push('/signin')
      router.refresh()
    }
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Check if any submenu item is active
  const isSubmenuActive = (items: any[]) => {
    return items.some(item => isActive(item.href))
  }

  // Menu items based on role
  const menuItems: Record<string, any[]> = {
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
      { href: '/dashboard/farm/training', label: 'Training', icon: 'chalkboard-teacher' },
      { href: '/dashboard/farm/profile', label: 'Profile', icon: 'user-cog' },
    ],
        admin: [
          { href: '/dashboard/admin', label: 'Dashboard', icon: 'home' },
          { 
            label: 'Users', 
            icon: 'users',
            submenu: [
              { href: '/dashboard/admin/users', label: 'All Users', icon: 'users' },
              { href: '/dashboard/admin/farms', label: 'Employers/Farms Management', icon: 'tractor' },
              { href: '/dashboard/admin/verification', label: 'Verification & Documents', icon: 'certificate' },
            ]
          },
          { 
            label: 'Recruitment', 
            icon: 'briefcase',
            submenu: [
              { href: '/dashboard/admin/jobs', label: 'Post Jobs', icon: 'briefcase' },
              { href: '/dashboard/admin/applications', label: 'All Applications', icon: 'file-alt' },
              { href: '/dashboard/admin/placements', label: 'Placements', icon: 'handshake' },
            ]
          },
          { 
            label: 'Operations', 
            icon: 'cogs',
            submenu: [
              { href: '/dashboard/admin/training', label: 'Training & Onboarding', icon: 'chalkboard-teacher' },
              { href: '/dashboard/admin/payments', label: 'Payments & Fees', icon: 'money-bill-wave' },
              { href: '/dashboard/admin/communications', label: 'Communications', icon: 'envelope' },
            ]
          },
          { 
            label: 'Analytics', 
            icon: 'chart-bar',
            submenu: [
              { href: '/dashboard/admin/reports', label: 'Reports & Analytics', icon: 'chart-bar' },
              { href: '/dashboard/admin/regions', label: 'Regions & Location', icon: 'map-marker-alt' },
            ]
          },
          { href: '/dashboard/admin/settings', label: 'System Settings', icon: 'cog' },
        ],
    student: [
      { href: '/dashboard/student', label: 'Dashboard', icon: 'home' },
      { href: '/dashboard/graduate/applications', label: 'My Applications', icon: 'file-alt' },
      { href: '/dashboard/student/jobs', label: 'Browse Jobs', icon: 'search' },
      { href: '/dashboard/graduate/documents', label: 'My Documents', icon: 'file-upload' },
      { href: '/dashboard/graduate/messages', label: 'Messages', icon: 'envelope' },
      { href: '/dashboard/graduate/notifications', label: 'Notifications', icon: 'bell' },
      { href: '/dashboard/student/training', label: 'Training', icon: 'chalkboard-teacher' },
      { href: '/dashboard/graduate/profile', label: 'Profile', icon: 'user-cog' },
    ],
  }

  const items = menuItems[role] || menuItems.graduate

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-background-dark rounded-lg shadow-lg border border-gray-200 dark:border-white/10"
      >
        <i className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'} text-gray-700 dark:text-white`}></i>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-background-dark border-r border-gray-200 dark:border-white/10
          transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/agrotalent-logo.webp" alt="AgroTalent Hub" className="w-8 h-8" />
            <div>
              <h2 className="text-[#101914] dark:text-white text-lg font-bold">AgroTalent Hub</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{roleDisplay} Dashboard</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${role === 'skilled' ? 'bg-accent/10' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
              <i className={`fas fa-user ${role === 'skilled' ? 'text-accent' : 'text-primary'}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile?.email || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {items.map((item, index) => {
              // Check if item has submenu
              if (item.submenu) {
                const submenuKey = `submenu-${index}`
                const isOpen = openSubmenus[submenuKey] ?? isSubmenuActive(item.submenu)
                const hasActiveChild = isSubmenuActive(item.submenu)

                return (
                  <li key={submenuKey}>
                    <button
                      onClick={() => toggleSubmenu(submenuKey)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors
                        ${hasActiveChild
                          ? role === 'skilled' 
                            ? 'bg-accent/10 text-accent border-l-4 border-accent'
                            : 'bg-primary/10 text-primary border-l-4 border-primary'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <i className={`fas fa-${item.icon} w-5`}></i>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs transition-transform`}></i>
                    </button>
                    {isOpen && (
                      <ul className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-white/10 pl-4">
                        {item.submenu.map((subItem: any) => (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                ${isActive(subItem.href)
                                  ? role === 'skilled'
                                    ? 'bg-accent/10 text-accent font-medium'
                                    : 'bg-primary/10 text-primary font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                }
                              `}
                            >
                              <i className={`fas fa-${subItem.icon} w-4`}></i>
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              }

              // Regular menu item
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive(item.href)
                        ? role === 'skilled'
                          ? 'bg-accent/10 text-accent border-l-4 border-accent'
                          : 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <i className={`fas fa-${item.icon} w-5`}></i>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <i className="fas fa-sign-out-alt w-5"></i>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
})
