'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 disabled:cursor-not-allowed disabled:bg-gray-50'

const labelClass = 'mb-1 block text-sm font-medium text-gray-700'
const hintClass = 'mt-1 text-xs text-gray-500'
const errorClass = 'mt-1 text-xs text-red-600'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className={labelClass}>
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            fieldClass,
            error && 'border-red-500 focus:border-red-600 focus:ring-red-600/30',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error ? (
          <p id={`${inputId}-hint`} className={hintClass}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, options, placeholder, id, ...props },
    ref
  ) => {
    const selectId = id ?? props.name
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={selectId} className={labelClass}>
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            fieldClass,
            error && 'border-red-500 focus:border-red-600 focus:ring-red-600/30',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error ? <p className={hintClass}>{hint}</p> : null}
        {error ? (
          <p id={`${selectId}-error`} role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const taId = id ?? props.name
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={taId} className={labelClass}>
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={taId}
          className={cn(
            fieldClass,
            'min-h-[96px] resize-y',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-600/30',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {hint && !error ? <p className={hintClass}>{hint}</p> : null}
        {error ? (
          <p id={`${taId}-error`} role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
