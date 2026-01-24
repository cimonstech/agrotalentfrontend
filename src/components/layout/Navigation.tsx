'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    // close drawer on navigation
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-solid border-[#e9f1ed] dark:border-white/10">
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
            href="/for-farms" 
            className={`text-sm font-medium transition-colors ${isActive('/for-farms') ? 'text-primary' : 'hover:text-primary'}`}
          >
            Employers/Farms
          </Link>
          <Link 
            href="/for-graduates" 
            className={`text-sm font-medium transition-colors ${isActive('/for-graduates') ? 'text-primary' : 'hover:text-primary'}`}
          >
            Graduates
          </Link>
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
                <Link href="/signin" className="hidden sm:flex px-4 py-2 bg-background-light dark:bg-white/5 border border-primary/20 text-primary dark:text-white text-sm font-bold rounded-lg hover:bg-primary/5 transition-colors">
                  Sign In
                </Link>
          <Link href="/signup" className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all">
            Register
          </Link>

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

      {/* Mobile right-side drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[70] ${mobileOpen ? '' : 'pointer-events-none'}`}
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
          <div className="p-4 border-b border-[#e9f1ed] dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg text-white">
                <i className="fas fa-seedling"></i>
              </div>
              <div>
                <div className="text-[#101914] dark:text-white font-bold">AgroTalent Hub</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Menu</div>
              </div>
            </div>
            <button
              type="button"
              className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <i className="fas fa-times text-gray-700 dark:text-white"></i>
            </button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home', icon: 'home' },
                { href: '/jobs', label: 'Jobs', icon: 'briefcase' },
                { href: '/services', label: 'Services', icon: 'cogs' },
                { href: '/for-farms', label: 'Employers/Farms', icon: 'tractor' },
                { href: '/for-graduates', label: 'Graduates', icon: 'graduation-cap' },
                { href: '/about', label: 'About Us', icon: 'info-circle' },
                { href: '/contact', label: 'Contact', icon: 'envelope' },
                { href: '/help-center', label: 'Help Center', icon: 'question-circle' },
                { href: '/privacy-policy', label: 'Privacy Policy', icon: 'shield-alt' },
                { href: '/terms-of-service', label: 'Terms of Service', icon: 'file-contract' }
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      isActive(item.href)
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <i className={`fas fa-${item.icon} w-5 ${isActive(item.href) ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}></i>
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-xl h-12 border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl h-12 bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                Register
              </Link>
            </div>
          </nav>
        </aside>
      </div>
    </header>
  )
}
