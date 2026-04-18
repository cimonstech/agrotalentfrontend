'use client'

import Image from 'next/image'

const ITEMS = [
  { n: 1, label: 'No Poverty' },
  { n: 2, label: 'Zero Hunger' },
  { n: 4, label: 'Quality Education' },
  { n: 8, label: 'Decent Work' },
  { n: 10, label: 'Reduced Inequalities' },
]

export function SDGBadgesRow({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-end justify-center gap-6 md:gap-10 ${className ?? ''}`}
    >
      {ITEMS.map((s) => (
        <div key={s.n} className="flex w-20 flex-col items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl shadow-sm">
            <Image
              src={`/Sustainable_Development_Goal_${s.n}.webp`}
              alt={`SDG ${s.n}`}
              fill
              className="object-contain"
              sizes="80px"
            />
          </div>
          <p className="mt-2 text-center text-xs text-gray-600">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
