'use client'

import { useState, ImgHTMLAttributes } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  fallbackSrc: string
  alt: string
  /** Used by next/image for local images; optional for fill layout */
  width?: number
  height?: number
  /** Used by next/image for responsive sizing */
  sizes?: string
}

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 500
const DEFAULT_SIZES = '(max-width: 768px) 100vw, 50vw'

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  sizes = DEFAULT_SIZES,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [useFallback, setUseFallback] = useState(false)

  // Use next/image for local public images so Next.js optimizes (WebP/AVIF, lazy load, srcset)
  const isLocal = typeof src === 'string' && src.startsWith('/')

  if (useFallback) {
    return (
      <img
        {...props}
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    )
  }

  if (isLocal) {
    const w = width ?? DEFAULT_WIDTH
    const h = height ?? DEFAULT_HEIGHT
    return (
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        sizes={sizes}
        className={className ?? ''}
        onError={() => setUseFallback(true)}
        style={{ objectFit: 'cover' }}
      />
    )
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setUseFallback(true)}
    />
  )
}
