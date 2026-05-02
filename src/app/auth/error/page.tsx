'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AuthErrorPage() {
  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      window.location.replace('/auth/handle-token' + window.location.hash)
      return
    }
  }, [])

  return (
    <div className='mx-auto flex max-w-md flex-col items-center justify-center py-32 text-center'>
      <div
        className='mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500 text-red-500'
        aria-hidden
      >
        <span className='text-3xl font-bold leading-none'>X</span>
      </div>
      <h1 className='mt-4 text-2xl font-bold text-gray-900'>Authentication Error</h1>
      <p className='mt-2 text-gray-500'>
        Something went wrong during sign in. Please try again.
      </p>
      <Link
        href='/signin'
        className='mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white'
      >
        Back to Sign In
      </Link>
    </div>
  )
}
