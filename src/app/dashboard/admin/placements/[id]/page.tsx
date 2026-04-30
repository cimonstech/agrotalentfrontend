'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const supabase = createSupabaseClient()

export default function PlacementDetailPage() {
  const params = useParams()
  const placementId = params.id as string
  const [placement, setPlacement] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error: qErr } = await supabase
        .from('placements')
        .select(`
          *,
          jobs:job_id ( title, location, city, job_type ),
          graduate:graduate_id (
            full_name, email, phone, qualification, specialization, preferred_region
          ),
          farm:farm_id (
            farm_name, full_name, email, phone, farm_location
          )
        `)
        .eq('id', placementId)
        .single()

      if (qErr || !data) {
        setError('Placement not found')
        setLoading(false)
        return
      }

      setPlacement(data)
      setLoading(false)
    }
    void load()
  }, [placementId])

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/3 rounded-xl bg-gray-200' />
          <div className='h-48 rounded-2xl bg-gray-100' />
        </div>
      </div>
    )
  }

  if (error || !placement) {
    return (
      <div className='p-6'>
        <p className='text-red-500'>{error || 'Placement not found'}</p>
        <Link href='/dashboard/admin/placements' className='mt-2 inline-block text-sm font-semibold text-brand'>
          Back to Placements
        </Link>
      </div>
    )
  }

  const job = Array.isArray(placement.jobs) ? placement.jobs[0] : placement.jobs as Record<string, unknown>
  const graduate = Array.isArray(placement.graduate) ? placement.graduate[0] : placement.graduate as Record<string, unknown>
  const farm = Array.isArray(placement.farm) ? placement.farm[0] : placement.farm as Record<string, unknown>

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <div className='mb-6 flex items-center gap-3'>
        <Link href='/dashboard/admin/placements' className='text-gray-400 hover:text-gray-700'>
          <ArrowLeft className='h-5 w-5' />
        </Link>
        <h1 className='text-xl font-bold text-gray-900'>Placement Details</h1>
      </div>

      <div className='space-y-4'>
        <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <h2 className='mb-4 font-bold text-gray-900'>Job</h2>
          <p className='font-semibold text-brand'>{job?.title as string}</p>
          <p className='text-sm text-gray-500'>{job?.city as string} {job?.location as string}</p>
          <p className='mt-1 text-xs capitalize text-gray-400'>{job?.job_type as string}</p>
        </div>

        <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <h2 className='mb-4 font-bold text-gray-900'>Candidate</h2>
          <p className='font-semibold text-gray-900'>{graduate?.full_name as string}</p>
          <p className='text-sm text-gray-500'>{graduate?.email as string}</p>
          <p className='text-sm text-gray-500'>{graduate?.phone as string}</p>
          <p className='mt-1 text-xs text-gray-400'>
            {graduate?.qualification as string} - {graduate?.specialization as string}
          </p>
        </div>

        <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <h2 className='mb-4 font-bold text-gray-900'>Farm</h2>
          <p className='font-semibold text-gray-900'>{farm?.farm_name as string}</p>
          <p className='text-sm text-gray-500'>{farm?.email as string}</p>
          <p className='text-sm text-gray-500'>{farm?.phone as string}</p>
        </div>

        <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <h2 className='mb-4 font-bold text-gray-900'>Status</h2>
          <span className='font-semibold capitalize text-brand'>{placement.status as string}</span>
          {placement.start_date ? (
            <p className='mt-2 text-sm text-gray-500'>
              Start date: {new Date(placement.start_date as string).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
