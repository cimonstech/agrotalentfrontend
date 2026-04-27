'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Users, MapPin, Briefcase, Lock, CheckCircle } from 'lucide-react'

const supabase = createSupabaseClient()

export default function FarmPreviewPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [job, setJob] = useState<Record<string, unknown> | null>(null)
  const [applications, setApplications] = useState<Record<string, unknown>[]>(
    []
  )

  useEffect(() => {
    const load = async () => {
      const { data: tokenRow, error: tokenErr } = await supabase
        .from('farm_preview_tokens')
        .select('*')
        .eq('token', token)
        .single()

      if (tokenErr || !tokenRow) {
        setError('Invalid or expired preview link.')
        setLoading(false)
        return
      }

      await supabase
        .from('farm_preview_tokens')
        .update({ viewed_at: new Date().toISOString() })
        .eq('token', token)

      const { data: jobData } = await supabase
        .from('jobs')
        .select(
          'id, title, location, city, job_type, salary_min, salary_max, salary_currency, benefits, description'
        )
        .eq('id', tokenRow.job_id as string)
        .single()

      setJob(jobData)

      const { data: apps } = await supabase
        .from('applications')
        .select(
          'id, match_score, status, profiles!applications_applicant_id_fkey(full_name, qualification, preferred_region, city)'
        )
        .eq('job_id', tokenRow.job_id as string)
        .order('match_score', { ascending: false })

      setApplications(apps ?? [])
      setLoading(false)
    }

    void load()
  }, [token])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F5F5F0]'>
        <div className='max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
          <p className='font-semibold text-red-500'>{error}</p>
          <Link
            href='/'
            className='mt-4 inline-block text-sm font-semibold text-brand'
          >
            Go to AgroTalent Hub
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F5F5F0]'>
      <div className='sticky top-0 z-10 border-b border-gray-100 bg-white'>
        <div className='mx-auto flex max-w-4xl items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-2'>
            <Image
              src='/agrotalent-logo.webp'
              alt='AgroTalent Hub'
              width={32}
              height={32}
            />
            <span className='text-sm font-bold text-forest'>AgroTalent Hub</span>
          </div>
          <Link
            href={'/signup/farm?ref=preview&job=' + String(job?.id ?? '')}
            className='rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-forest'
          >
            Register Free
          </Link>
        </div>
      </div>

      <div className='mx-auto max-w-4xl px-6 py-8'>
        <div className='mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {job?.title as string}
              </h1>
              <div className='mt-2 flex flex-wrap items-center gap-3'>
                <span className='flex items-center gap-1 text-sm text-gray-500'>
                  <MapPin className='h-4 w-4' />
                  {job?.city ? (job.city as string) + ', ' : ''}
                  {job?.location as string}
                </span>
                <span className='flex items-center gap-1 text-sm text-gray-500'>
                  <Briefcase className='h-4 w-4' />
                  {job?.job_type as string}
                </span>
                <span className='flex items-center gap-1 text-sm font-semibold text-brand'>
                  <Users className='h-4 w-4' />
                  {applications.length} applicant
                  {applications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-forest to-brand p-6'>
          <div>
            <h2 className='text-lg font-bold text-white'>
              {applications.length} candidate
              {applications.length !== 1 ? 's' : ''} applied for this position
            </h2>
            <p className='mt-1 text-sm text-white/70'>
              Register your farm free to see full profiles and contact
              candidates directly.
            </p>
          </div>
          <Link
            href={'/signup/farm?ref=preview&job=' + String(job?.id ?? '')}
            className='flex-shrink-0 whitespace-nowrap rounded-xl bg-gold px-6 py-3 font-bold text-forest transition-colors hover:bg-gold/90'
          >
            Register to See All
          </Link>
        </div>

        <div className='mb-6'>
          <h3 className='mb-4 font-bold text-gray-900'>
            Candidate Previews
            <span className='ml-2 text-sm font-normal text-gray-400'>
              (names hidden, register to view full profiles)
            </span>
          </h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {applications.map((app, i) => {
              const profile = Array.isArray(app.profiles)
                ? (app.profiles as Record<string, unknown>[])[0]
                : (app.profiles as Record<string, unknown>)
              const name = (profile?.full_name as string) ?? 'Candidate'
              const initials = name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const score = (app.match_score as number) ?? 0
              const scoreColor =
                score >= 70
                  ? 'text-green-600 bg-green-50'
                  : score >= 50
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-gray-500 bg-gray-100'

              return (
                <div
                  key={app.id as string}
                  className='relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-lg font-bold text-brand'>
                      {initials}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-semibold text-gray-900'>
                          Candidate {i + 1}
                        </p>
                        <span
                          className={[
                            'rounded-full px-2.5 py-1 text-xs font-bold',
                            scoreColor,
                          ].join(' ')}
                        >
                          {score}% match
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-gray-500'>
                        {(profile?.qualification as string) ??
                          'Qualification not disclosed'}
                      </p>
                      <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-400'>
                        <MapPin className='h-3 w-3' />
                        {(profile?.city as string) ??
                          (profile?.preferred_region as string) ??
                          'Location not disclosed'}
                      </p>
                    </div>
                  </div>

                  <div className='mt-3 border-t border-gray-50 pt-3'>
                    <div className='relative'>
                      <div className='pointer-events-none flex gap-2 select-none blur-sm'>
                        <span className='rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400'>
                          Contact info
                        </span>
                        <span className='rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400'>
                          Full CV
                        </span>
                        <span className='rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400'>
                          Work history
                        </span>
                      </div>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 backdrop-blur-sm'>
                          <Lock className='h-3 w-3 text-gray-400' />
                          <span className='text-xs font-medium text-gray-500'>
                            Register to unlock
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className='rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10'>
            <Users className='h-8 w-8 text-brand' />
          </div>
          <h3 className='mb-2 text-xl font-bold text-gray-900'>Ready to hire?</h3>
          <p className='mx-auto mb-6 max-w-md text-sm text-gray-500'>
            Register your farm on AgroTalent Hub to see full candidate profiles,
            contact applicants directly, and manage your entire hiring process
            in one place. It is free to register.
          </p>
          <div className='flex flex-col justify-center gap-3 sm:flex-row'>
            <Link
              href={'/signup/farm?ref=preview&job=' + String(job?.id ?? '')}
              className='rounded-xl bg-brand px-8 py-3 font-bold text-white transition-colors hover:bg-forest'
            >
              Register Your Farm Free
            </Link>
            <Link
              href='/jobs'
              className='rounded-xl border border-gray-200 px-8 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50'
            >
              Browse All Jobs
            </Link>
          </div>

          <div className='mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400'>
            <span className='flex items-center gap-1'>
              <CheckCircle className='h-3.5 w-3.5 text-brand' />
              Free to register
            </span>
            <span className='flex items-center gap-1'>
              <CheckCircle className='h-3.5 w-3.5 text-brand' />
              No credit card needed
            </span>
            <span className='flex items-center gap-1'>
              <CheckCircle className='h-3.5 w-3.5 text-brand' />
              Post jobs instantly
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
