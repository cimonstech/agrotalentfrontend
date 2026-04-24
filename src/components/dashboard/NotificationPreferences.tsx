'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const supabase = createSupabaseClient()

interface Preferences {
  email_applications: boolean
  email_status_updates: boolean
  email_placements: boolean
  email_training: boolean
  email_notices: boolean
  email_messages: boolean
  sms_applications: boolean
  sms_status_updates: boolean
  sms_placements: boolean
  sms_training: boolean
}

const DEFAULT_PREFERENCES: Preferences = {
  email_applications: true,
  email_status_updates: true,
  email_placements: true,
  email_training: true,
  email_notices: true,
  email_messages: false,
  sms_applications: true,
  sms_status_updates: true,
  sms_placements: true,
  sms_training: false,
}

interface NotificationPreferencesProps {
  profile: Profile
}

export default function NotificationPreferences({ profile }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_prefs_' + profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setPrefs({ ...DEFAULT_PREFERENCES, ...(data.value as Partial<Preferences>) })
        }
        setLoading(false)
      })
  }, [profile.id])

  const toggle = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('system_settings')
      .upsert({
        key: 'notification_prefs_' + profile.id,
        value: prefs,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return <div className='h-48 bg-gray-50 rounded-2xl animate-pulse' />
  }

  const Toggle = ({ prefKey }: { prefKey: keyof Preferences }) => (
    <button
      onClick={() => toggle(prefKey)}
      className={[
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0',
        prefs[prefKey] ? 'bg-brand' : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          prefs[prefKey] ? 'translate-x-4' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )

  const Row = ({ label, desc, prefKey }: { label: string; desc: string; prefKey: keyof Preferences }) => (
    <div className='flex items-center justify-between py-3 border-b border-gray-50 last:border-0'>
      <div className='flex-1 mr-4'>
        <p className='text-sm font-medium text-gray-800'>{label}</p>
        <p className='text-xs text-gray-400 mt-0.5'>{desc}</p>
      </div>
      <Toggle prefKey={prefKey} />
    </div>
  )

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-2xl border border-gray-100 p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <Mail className='w-4 h-4 text-brand' />
          <h3 className='font-semibold text-sm text-gray-800'>Email Notifications</h3>
          <Bell className='w-4 h-4 text-gray-400 ml-auto' />
        </div>
        <Row prefKey='email_applications' label='New applications' desc='When someone applies to your job or when you receive a match' />
        <Row prefKey='email_status_updates' label='Application status updates' desc='When your application status changes' />
        <Row prefKey='email_placements' label='Placement confirmations' desc='When a placement is confirmed' />
        <Row prefKey='email_training' label='Training sessions' desc='When a training session is scheduled for you' />
        <Row prefKey='email_notices' label='Platform notices' desc='When admin posts a notice to your role' />
        <Row prefKey='email_messages' label='New messages' desc='When you receive a new message' />
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <MessageSquare className='w-4 h-4 text-brand' />
          <h3 className='font-semibold text-sm text-gray-800'>SMS Notifications</h3>
          {!profile.phone && (
            <span className='ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full'>
              Add phone number to enable
            </span>
          )}
        </div>
        <Row prefKey='sms_applications' label='New applications' desc='SMS when applications are received or matched' />
        <Row prefKey='sms_status_updates' label='Application status updates' desc='SMS when your application status changes' />
        <Row prefKey='sms_placements' label='Placement confirmations' desc='SMS when a placement is confirmed' />
        <Row prefKey='sms_training' label='Training reminders' desc='SMS reminder before a training session' />
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-xs text-gray-400'>
          Changes apply to future notifications only
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className='bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-forest transition-colors disabled:opacity-50'
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
