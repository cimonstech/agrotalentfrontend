'use client'

import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

export type AvatarProps = {
  name: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { box: 'h-8 w-8 text-xs', px: 32 },
  md: { box: 'h-10 w-10 text-sm', px: 40 },
  lg: { box: 'h-14 w-14 text-base', px: 56 },
}

export function Avatar({
  name,
  imageUrl,
  size = 'md',
  className,
}: AvatarProps) {
  const s = sizeMap[size]
  const showImage = Boolean(imageUrl?.trim())

  if (showImage && imageUrl) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white',
          s.box,
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={name ? `Avatar of ${name}` : 'Avatar'}
          width={s.px}
          height={s.px}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-800 ring-2 ring-white',
        s.box,
        className
      )}
      aria-hidden={!name}
    >
      {getInitials(name)}
    </span>
  )
}
