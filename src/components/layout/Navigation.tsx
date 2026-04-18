'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/services', label: 'Services' },
  { href: '/impact', label: 'Impact' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navigation() {
  const pathname = usePathname()
  const hideBrandImage = pathname?.startsWith('/signup') ?? false
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2 shadow-sm"
          >
            {hideBrandImage ? null : (
              <Image
                src="/agrotalent-logo.webp"
                alt=""
                width={28}
                height={28}
              />
            )}
            <span className="font-ubuntu text-sm font-bold text-forest">
              AgroTalent Hub
            </span>
          </Link>

          <nav
            className="hidden flex-1 justify-center lg:flex"
            aria-label="Primary"
          >
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href
                const linkClass = active
                  ? 'rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-forest'
                  : 'rounded-full px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-100 hover:text-forest'
                return (
                  <Link key={href} href={href} className={linkClass}>
                    {label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/signin"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-forest transition-colors hover:bg-gold/90"
            >
              Register
            </Link>
          </div>

          <button
            type="button"
            className="p-2 text-black lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect y="4" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="10" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="16" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            role="presentation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed bottom-0 right-0 top-0 z-50 flex w-72 flex-col bg-forest p-6">
            <button
              type="button"
              className="absolute right-6 top-6 text-white"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="mt-8 mb-6 flex items-center gap-2">
              {hideBrandImage ? null : (
                <Image
                  src="/agrotalent-logo.webp"
                  alt=""
                  width={28}
                  height={28}
                />
              )}
              <span className="font-bold text-white">AgroTalent Hub</span>
            </div>

            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="border-b border-white/10 py-3 text-base font-medium text-white/80 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/signin"
                className="rounded-full border border-white/30 py-3 text-center text-white"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gold py-3 text-center font-bold text-forest"
                onClick={() => setMobileOpen(false)}
              >
                Register
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}

export { Navigation }
