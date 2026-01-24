'use client'

import { useEffect, useState } from 'react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-[60] h-12 w-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center border border-white/10"
      aria-label="Back to top"
      title="Back to top"
    >
      <i className="fas fa-arrow-up"></i>
    </button>
  )
}

