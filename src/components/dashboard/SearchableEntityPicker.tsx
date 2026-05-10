'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { cn } from '@/lib/utils'

export type SearchablePickerOption = { id: string; label: string }

export function SearchableEntityPicker({
  label,
  placeholder,
  valueId,
  valueLabel,
  onClear,
  onSelect,
  fetchOptions,
  disabled,
}: {
  label: string
  placeholder: string
  valueId: string | null
  valueLabel: string | null
  onClear: () => void
  onSelect: (id: string, label: string) => void
  fetchOptions: (query: string) => Promise<SearchablePickerOption[]>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 320)
  const [options, setOptions] = useState<SearchablePickerOption[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const rows = await fetchOptions(debouncedQuery.trim())
        if (!cancelled) setOptions(rows)
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery, fetchOptions])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const display = valueId && valueLabel ? valueLabel : ''

  return (
    <div ref={wrapRef} className="relative">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            'flex min-h-[42px] w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <span className={cn('truncate pr-2', !display && 'text-gray-400')}>
            {display || placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-gray-400 transition', open && 'rotate-180')}
            aria-hidden
          />
        </button>
        {valueId ? (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => {
              onClear()
              setQuery('')
              setOpen(false)
            }}
            className="shrink-0 rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg">
          <input
            autoFocus
            className="w-full border-b border-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="Type to search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="max-h-56 overflow-y-auto overscroll-contain py-1 text-sm">
            {loading ? (
              <li className="px-3 py-2 text-gray-500">Searching…</li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-gray-500">No matches</li>
            ) : (
              options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      onSelect(o.id, o.label)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="line-clamp-2">{o.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
