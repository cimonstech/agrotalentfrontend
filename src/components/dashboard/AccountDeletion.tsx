'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'

const supabase = createSupabaseClient()

export default function AccountDeletion() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT'

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      setError('Please type the confirmation phrase exactly')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + session.access_token,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to delete account')
        setLoading(false)
        return
      }

      await supabase.auth.signOut()
      router.push('/?deleted=true')
    } catch (_err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <div className='bg-red-50 border border-red-100 rounded-2xl p-6'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h3 className='font-semibold text-red-700 text-sm'>Delete Account</h3>
            <p className='text-red-600 text-xs mt-1 leading-relaxed'>
              Permanently delete your account and all associated data. This action cannot be undone.
              Your applications, messages, and placement history will be anonymized.
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              className='mt-4 border border-red-300 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors'
            >
              I want to delete my account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-red-50 border border-red-200 rounded-2xl p-6'>
      <div className='flex items-start gap-3 mb-4'>
        <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
        <div>
          <h3 className='font-semibold text-red-700'>Are you absolutely sure?</h3>
          <p className='text-red-600 text-xs mt-1 leading-relaxed'>
            This will permanently delete your account. Your profile data will be anonymized and you will lose access to all your applications, messages, and placement records.
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        <div>
          <label className='text-xs font-semibold text-red-700 block mb-1.5'>
            Type <span className='font-mono bg-red-100 px-1 rounded'>DELETE MY ACCOUNT</span> to confirm
          </label>
          <input
            type='text'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='DELETE MY ACCOUNT'
            className='w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white'
          />
        </div>

        {error && (
          <p className='text-red-600 text-xs'>{error}</p>
        )}

        <div className='flex gap-3'>
          <button
            onClick={() => { setShowConfirm(false); setConfirmText(''); setError('') }}
            className='flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== CONFIRM_PHRASE}
            className='flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
