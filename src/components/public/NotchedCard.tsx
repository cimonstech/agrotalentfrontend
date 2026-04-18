import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type NotchedCardProps = {
  imageSrc?: string | null
  imageAlt?: string
  title: string
  description: string
  buttonLabel: string
  buttonHref: string
  accentColor?: string
  notchColor?: string
  className?: string
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NotchedCard({
  imageSrc,
  imageAlt = '',
  title,
  description,
  buttonLabel,
  buttonHref,
  accentColor = '#1A6B3C',
  notchColor = '#0D3320',
  className,
}: NotchedCardProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center gap-4 rounded-[20px] bg-cream p-3 font-ubuntu">
        <div className="relative h-28 w-36 flex-shrink-0 overflow-hidden rounded-xl">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="144px"
            />
          ) : (
            <div className="h-full w-full bg-brand" aria-hidden />
          )}
        </div>
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-bold leading-snug text-forest">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
          <Link
            href={buttonHref}
            className="mt-3 inline-flex rounded-full border-[1.5px] border-forest px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-forest"
          >
            {buttonLabel}
          </Link>
        </div>

        <svg
          className="pointer-events-none absolute right-0 top-0 z-[3] h-[54px] w-[54px]"
          width="54"
          height="54"
          viewBox="0 0 54 54"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M0,0 H34 A20,20 0 0,1 54,20 V54 H34 A20,20 0 0,1 14,34 V0 Z"
            fill={notchColor}
          />
        </svg>
        <div
          className="absolute right-[10px] top-[10px] z-[4] flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        >
          <ArrowIcon />
        </div>
      </div>
    </div>
  )
}
