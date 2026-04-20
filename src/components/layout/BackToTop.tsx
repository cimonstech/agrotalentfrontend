'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function BackToTop() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith('/dashboard')) return
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (pathname?.startsWith('/dashboard')) return null
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-primary text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl [&_svg]:text-white"
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        className="h-5 w-5 shrink-0 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

