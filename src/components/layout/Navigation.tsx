'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [forYouOpen, setForYouOpen] = useState(false)
  const [mobileForYouOpen, setMobileForYouOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const supabase = createSupabaseClient()

  const isActive = (path: string) => pathname === path
  
  const isForYouActive = () => {
    return ['/for-farms', '/for-graduates', '/for-skilled', '/for-students'].some(path => pathname === path)
  }

  useEffect(() => {
    // close drawer on navigation
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-user-menu]')) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, farm_name')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  const getDashboardPath = () => {
    if (!profile) return '/dashboard/graduate'
    const role = profile.role || 'graduate'
    // Map student to graduate dashboard
    return role === 'student' ? '/dashboard/graduate' : `/dashboard/${role}`
  }

  const getUserDisplayName = () => {
    if (profile?.farm_name) return profile.farm_name
    if (profile?.full_name) return profile.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <>
      <header className="fixed md:sticky top-0 z-[100] w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-solid border-[#e9f1ed] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <i className="fas fa-seedling"></i>
            </div>
            <h2 className="text-[#101914] dark:text-white text-xl font-bold tracking-tight">AgroTalent Hub</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'hover:text-primary'}`}
            >
              Home
            </Link>
            <Link
              href="/jobs"
              className={`text-sm font-medium transition-colors ${isActive('/jobs') ? 'text-primary' : 'hover:text-primary'}`}
            >
              Jobs
            </Link>
            <Link
              href="/services"
              className={`text-sm font-medium transition-colors ${isActive('/services') ? 'text-primary' : 'hover:text-primary'}`}
            >
              Services
            </Link>
            <Link
              href="/impact"
              className={`text-sm font-medium transition-colors ${isActive('/impact') ? 'text-primary' : 'hover:text-primary'}`}
            >
              Impact
            </Link>

            {/* For You Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setForYouOpen(true)}
              onMouseLeave={() => setForYouOpen(false)}
            >
              <button
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${isForYouActive() ? 'text-primary' : 'hover:text-primary'}`}
              >
                For You
                <i className={`fas fa-chevron-down text-xs transition-transform ${forYouOpen ? 'rotate-180' : ''}`}></i>
              </button>
              
              {/* Dropdown Menu */}
              {forYouOpen && (
                <div className="absolute top-full left-0 pt-2 w-56 z-50">
                  <div className="bg-white dark:bg-background-dark rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-2">
                  <Link
                    href="/for-farms"
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive('/for-farms')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className="fas fa-tractor w-4 text-primary"></i>
                    <span className="font-medium">Employers/Farms</span>
                  </Link>
                  <Link
                    href="/for-graduates"
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive('/for-graduates')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className="fas fa-graduation-cap w-4 text-primary"></i>
                    <span className="font-medium">Graduates</span>
                  </Link>
                  <Link
                    href="/for-skilled"
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive('/for-skilled')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className="fas fa-hands-helping w-4 text-accent"></i>
                    <span className="font-medium">Skilled Workers</span>
                  </Link>
                  <Link
                    href="/for-students"
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive('/for-students')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className="fas fa-user-graduate w-4 text-primary"></i>
                    <span className="font-medium">Students</span>
                  </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-primary' : 'hover:text-primary'}`}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-primary' : 'hover:text-primary'}`}
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="hidden sm:flex items-center justify-center w-8 h-8">
                <i className="fas fa-spinner fa-spin text-primary"></i>
              </div>
            ) : user ? (
              <>
                {/* User Menu - Desktop */}
                <div className="hidden sm:block relative" data-user-menu>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-background-light dark:bg-white/5 border border-primary/20 text-primary dark:text-white text-sm font-bold rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <i className="fas fa-user-circle"></i>
                    <span className="hidden md:inline">{getUserDisplayName()}</span>
                    <i className={`fas fa-chevron-down text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-background-dark rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-2 z-50" data-user-menu>
                      <Link
                        href={getDashboardPath()}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt w-4 text-primary"></i>
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href={`${getDashboardPath()}/profile`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <i className="fas fa-user w-4 text-primary"></i>
                        <span>Profile</span>
                      </Link>
                      <div className="border-t border-gray-200 dark:border-white/10 my-1"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <i className="fas fa-sign-out-alt w-4"></i>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/signin" className="hidden sm:flex px-4 py-2 bg-background-light dark:bg-white/5 border border-primary/20 text-primary dark:text-white text-sm font-bold rounded-lg hover:bg-primary/5 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="hidden md:flex px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">
                  Register
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-primary/20 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <i className="fas fa-bars text-primary dark:text-white"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile right-side drawer - Outside header with higher z-index */}
      <div
        className={`md:hidden fixed inset-0 z-[9999] ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <aside
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-background-dark shadow-2xl border-l border-[#e9f1ed] dark:border-white/10 transform transition-transform ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-3 md:p-4 border-b border-[#e9f1ed] dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-primary rounded-lg text-white">
                <i className="fas fa-seedling text-sm md:text-base"></i>
              </div>
              <div>
                <div className="text-[#101914] dark:text-white font-bold text-sm md:text-base">AgroTalent Hub</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Menu</div>
              </div>
            </div>
            <button
              type="button"
              className="h-8 w-8 md:h-10 md:w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <i className="fas fa-times text-gray-700 dark:text-white text-sm md:text-base"></i>
            </button>
          </div>

          <nav className="p-3 md:p-4 overflow-y-auto h-[calc(100%-80px)]">
            <ul className="space-y-1 md:space-y-2">
              {[
                { href: '/', label: 'Home', icon: 'home' },
                { href: '/jobs', label: 'Jobs', icon: 'briefcase' },
                { href: '/services', label: 'Services', icon: 'cogs' },
                { href: '/impact', label: 'Our Impact', icon: 'heart' }
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-colors ${
                      isActive(item.href)
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className={`fas fa-${item.icon} text-sm md:text-base w-4 md:w-5 ${isActive(item.href) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}></i>
                    <span className="font-semibold text-sm md:text-base">{item.label}</span>
                  </Link>
                </li>
              ))}

              {/* For You Expandable Section */}
              <li>
                <button
                  onClick={() => setMobileForYouOpen(!mobileForYouOpen)}
                  className={`w-full flex items-center justify-between gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-colors ${
                    isForYouActive()
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <i className={`fas fa-users text-sm md:text-base w-4 md:w-5 ${isForYouActive() ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}></i>
                    <span className="font-semibold text-sm md:text-base">For You</span>
                  </div>
                  <i className={`fas fa-chevron-down text-xs transition-transform ${mobileForYouOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {/* Submenu */}
                {mobileForYouOpen && (
                  <ul className="mt-1 ml-6 space-y-1">
                    {[
                      { href: '/for-farms', label: 'Employers/Farms', icon: 'tractor' },
                      { href: '/for-graduates', label: 'Graduates', icon: 'graduation-cap' },
                      { href: '/for-skilled', label: 'Skilled Workers', icon: 'hands-helping' },
                      { href: '/for-students', label: 'Students', icon: 'user-graduate' }
                    ].map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(subItem.href)
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <i className={`fas fa-${subItem.icon} w-4 ${isActive(subItem.href) ? 'text-primary' : 'text-gray-400'}`}></i>
                          <span className="font-medium">{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {[
                { href: '/about', label: 'About Us', icon: 'info-circle' },
                { href: '/contact', label: 'Contact', icon: 'envelope' },
                { href: '/help-center', label: 'Help Center', icon: 'question-circle' },
                { href: '/privacy-policy', label: 'Privacy Policy', icon: 'shield-alt' },
                { href: '/terms-of-service', label: 'Terms of Service', icon: 'file-contract' }
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-colors ${
                      isActive(item.href)
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className={`fas fa-${item.icon} text-sm md:text-base w-4 md:w-5 ${isActive(item.href) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}></i>
                    <span className="font-semibold text-sm md:text-base">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 md:mt-6">
              {loading ? (
                <div className="flex items-center justify-center w-full h-10 md:h-12">
                  <i className="fas fa-spinner fa-spin text-primary"></i>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardPath()}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl h-10 md:h-12 border border-primary/20 text-primary font-bold text-sm md:text-base hover:bg-primary/5 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <i className="fas fa-tachometer-alt"></i>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      handleSignOut()
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl h-10 md:h-12 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm md:text-base hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center w-full rounded-xl h-10 md:h-12 border border-primary/20 text-primary font-bold text-sm md:text-base hover:bg-primary/5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </>
  )
}
