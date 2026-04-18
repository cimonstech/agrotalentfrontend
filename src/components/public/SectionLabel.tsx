import { cn } from '@/lib/utils'

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-gold',
        className
      )}
    >
      {children}
    </span>
  )
}
