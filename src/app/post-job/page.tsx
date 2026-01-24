'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PostJobGatePage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      // Not signed in -> must sign up before posting a job
      if (!session) {
        router.replace('/signup/farm')
        return
      }

      const role = session.user?.user_metadata?.role

      if (role === 'admin') {
        router.replace('/dashboard/admin/jobs')
        return
      }

      if (role === 'farm') {
        router.replace('/dashboard/farm/jobs/new')
        return
      }

      // Signed in but not an employer -> direct them to employer signup
      router.replace('/signup/farm')
    }

    run()
  }, [router])

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-background-dark border border-primary/10 rounded-2xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-briefcase text-2xl"></i>
        </div>
        <h1 className="text-2xl font-black text-[#101914] dark:text-white mb-2">Preparing your job post…</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting you to the right place.
        </p>
      </div>
    </main>
  )
}

