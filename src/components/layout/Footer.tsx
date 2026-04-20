'use client'

import Image from 'next/image'
import Link from 'next/link'

const PLATFORM = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/services', label: 'Services' },
  { href: '/for-farms', label: 'For Farms' },
  { href: '/for-graduates', label: 'For Graduates' },
  { href: '/for-students', label: 'For Students' },
  { href: '/for-skilled', label: 'For Skilled Workers' },
]

const COMPANY = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/help-center', label: 'Help Center' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
]

function SocialIcon({ name }: { name: 'linkedin' | 'twitter' | 'facebook' }) {
  if (name === 'linkedin') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
  if (name === 'twitter') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-forest font-ubuntu text-white">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/agrotalent-logo.webp"
                alt=""
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="text-xl font-bold">AgroTalent Hub</span>
            </div>
            <p className="mt-3 max-w-[200px] text-sm leading-relaxed text-white/60">
              Connecting verified agricultural talent with modern farms across
              Ghana.
            </p>
            <div className="mt-6 flex gap-2">
              {(
                [
                  ['linkedin', 'https://linkedin.com'],
                  ['twitter', 'https://twitter.com'],
                  ['facebook', 'https://facebook.com'],
                ] as const
              ).map(([name, href]) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-white/50 hover:bg-white/10"
                  aria-label={name}
                >
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Platform
            </p>
            {PLATFORM.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Company
            </p>
            {COMPANY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Contact
            </p>
            <ul className="space-y-1 text-sm text-white/70">
              <li className="flex items-center gap-2 py-1">
                <a href="mailto:support@agrotalenthub.com" className="hover:text-white">
                  support@agrotalenthub.com
                </a>
              </li>
              <li className="flex items-center gap-2 py-1">
                <a href="tel:+233543435294" className="hover:text-white">
                  +233 54 343 5294
                </a>
              </li>
              <li className="flex items-center gap-2 py-1">
                <a href="tel:+233553018172" className="hover:text-white">
                  +233 55 301 8172
                </a>
              </li>
              <li className="flex items-center gap-2 py-1">Accra Ghana</li>
            </ul>
            <div className="mt-6">
              <p className="mb-2 text-xs text-white/50">Stay updated</p>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-gold py-2 text-sm font-semibold text-forest hover:bg-gold/90"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row">
          <p>© 2026 AgroTalent Hub. All rights reserved.</p>
          <p>Built for Ghana&apos;s agricultural future.</p>
        </div>
      </div>
    </footer>
  )
}
