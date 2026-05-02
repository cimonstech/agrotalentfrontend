'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  name?: string
  id?: string
  className?: string
  required?: boolean
  autoComplete?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  name,
  id,
  className,
  required,
  autoComplete,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className='relative'>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        required={required}
        autoComplete={autoComplete}
        className={[
          'w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm focus:border-brand focus:outline-none',
          className ?? '',
        ].join(' ')}
      />
      <button
        type='button'
        onClick={() => setShow((prev) => !prev)}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
      </button>
    </div>
  )
}
