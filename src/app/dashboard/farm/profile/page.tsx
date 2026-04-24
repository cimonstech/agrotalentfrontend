'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { GHANA_REGIONS } from '@/lib/utils'
import ProfileStrength from '@/components/dashboard/ProfileStrength'
import AccountDeletion from '@/components/dashboard/AccountDeletion'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Badge'

const supabase = createSupabaseClient()

type FormValues = {
  full_name: string
  phone: string
  farm_name: string
  farm_type: string
  farm_location: string
  farm_address: string
}

const regionOptions = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

export default function FarmProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      full_name: '',
      phone: '',
      farm_name: '',
      farm_type: '',
      farm_location: '',
      farm_address: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) {
        setLoading(false)
        return
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled || !p) {
        setLoading(false)
        return
      }
      const prof = p as Profile
      setProfile(prof)
      setEmail(prof.email ?? '')
      setVerified(prof.is_verified ?? false)
      reset({
        full_name: prof.full_name ?? '',
        phone: prof.phone ?? '',
        farm_name: prof.farm_name ?? '',
        farm_type: prof.farm_type ?? '',
        farm_location: prof.farm_location ?? '',
        farm_address: prof.farm_address ?? '',
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [reset])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    setSuccess(false)
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) {
      setError('You must be signed in.')
      setSaving(false)
      return
    }
    const payload = {
      full_name: values.full_name.trim() || null,
      phone: values.phone.trim() || null,
      farm_name: values.farm_name.trim() || null,
      farm_type: values.farm_type.trim() || null,
      farm_location: values.farm_location.trim() || null,
      farm_address: values.farm_address.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: uErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', uid)
    setSaving(false)
    if (uErr) {
      setError(uErr.message)
      return
    }
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (refreshed) setProfile(refreshed as Profile)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  async function cropToSquare(file: File): Promise<Blob> {
    const imageUrl = URL.createObjectURL(file)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to process image'))
        img.src = imageUrl
      })

      const size = Math.min(image.width, image.height)
      const sx = Math.floor((image.width - size) / 2)
      const sy = Math.floor((image.height - size) / 2)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to prepare image canvas')
      ctx.drawImage(image, sx, sy, size, size, 0, 0, size, size)

      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to crop image'))
            return
          }
          resolve(blob)
        }, 'image/jpeg', 0.9)
      })

      return croppedBlob
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  async function handleLogoUpload(file: File) {
    setLogoError('')
    setSuccess(false)
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo file size must be 5MB or less.')
      return
    }

    setLogoUploading(true)
    try {
      const croppedBlob = await cropToSquare(file)
      const uploadFile = new File([croppedBlob], 'farm-logo.jpg', {
        type: 'image/jpeg',
      })
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch('/api/profile/upload-farm-logo', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      const logoUrl = typeof data.url === 'string' ? data.url : null
      if (logoUrl) {
        setProfile((prev) => (prev ? { ...prev, farm_logo_url: logoUrl } : prev))
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (e: any) {
      setLogoError(e.message || 'Failed to upload logo')
    } finally {
      setLogoUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-10">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="mt-2">
          {verified ? (
            <Pill variant="green">Verified</Pill>
          ) : (
            <Pill variant="yellow">Pending Verification</Pill>
          )}
        </div>

        {profile ? (
          <Card className="mb-6" padding="none">
            <ProfileStrength profile={profile} />
          </Card>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Profile saved.
            </p>
          ) : null}

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
            <div className="mt-4 space-y-4">
              <Input label="Full name" {...register('full_name')} />
              <Input label="Phone" type="tel" {...register('phone')} />
              <Input label="Email" value={email} disabled readOnly />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-gray-900">Farm</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Farm logo</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    {profile?.farm_logo_url ? (
                      <Image
                        src={profile.farm_logo_url}
                        alt="Farm logo"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">No logo</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={logoUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleLogoUpload(file)
                        e.currentTarget.value = ''
                      }}
                      className="block text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-forest disabled:opacity-60"
                    />
                    <p className="text-xs text-gray-500">
                      Upload a logo image. We auto-crop it to a 1:1 square.
                    </p>
                  </div>
                </div>
                {logoError ? (
                  <p className="mt-2 text-sm text-red-600">{logoError}</p>
                ) : null}
              </div>
              <Input label="Farm name" {...register('farm_name')} />
              <Select
                label="Farm type"
                {...register('farm_type')}
                options={[
                  { value: '', label: 'Select' },
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                  {
                    value: 'agro_processing',
                    label: 'Agro processing',
                  },
                  { value: 'research', label: 'Research' },
                ]}
              />
              <Select
                label="Farm location (region)"
                {...register('farm_location')}
                options={[
                  { value: '', label: 'Select region' },
                  ...regionOptions,
                ]}
              />
              <Textarea
                label="Farm address"
                {...register('farm_address')}
                rows={4}
              />
            </div>
          </Card>

          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </form>

        <div className='mt-8'>
          <h2 className='font-bold text-lg text-gray-900 mb-4'>Notification Preferences</h2>
          {profile && <NotificationPreferences profile={profile} />}
        </div>

        <div className='mt-8 pt-8 border-t border-gray-100'>
          <h2 className='font-bold text-lg text-gray-900 mb-4'>Account</h2>
          <AccountDeletion />
        </div>
      </div>
    </div>
  )
}
