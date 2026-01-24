'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const router = useRouter()
  const [hoveredJob, setHoveredJob] = useState<number | null>(null)
  const [jobPostings, setJobPostings] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true)
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        // Transform API jobs to match the expected format
        const transformedJobs = (data.jobs || []).slice(0, 4).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.profiles?.farm_name || 'AgroTalent Hub',
          location: job.location,
          salary: job.salary_min && job.salary_max 
            ? `GHS ${job.salary_min} - ${job.salary_max}`
            : job.salary_min 
            ? `GHS ${job.salary_min}+`
            : 'Salary negotiable',
          type: job.job_type?.replace('_', ' ') || 'Full-time',
          posted: getTimeAgo(job.created_at),
          description: job.description || '',
          requirements: []
        }))
        setJobPostings(transformedJobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    // Check if this is a Supabase redirect with password reset or email verification token/errors
    const hash = window.location.hash
    
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      
      // Check for errors first (expired token, etc.)
      const error = hashParams.get('error')
      const errorCode = hashParams.get('error_code')
      const type = hashParams.get('type')
      
      if (error || errorCode) {
        // There's an error - redirect to appropriate page with error
        if (type === 'recovery' || errorCode === 'otp_expired') {
          // Password reset error - redirect to reset password page with error
          router.replace(`/reset-password${hash}`)
          return
        }
        if (type === 'signup' || type === 'email') {
          // Email verification error - redirect to verify email page with error
          router.replace(`/verify-email${hash}`)
          return
        }
      }
      
      // Check for access_token (successful redirect)
      if (hash.includes('access_token=')) {
        // Check for password reset redirect
        if (hash.includes('type=recovery')) {
          router.replace(`/reset-password${hash}`)
          return
        }
        
        // Check for email verification redirect
        if (hash.includes('type=signup') || hash.includes('type=email')) {
          router.replace(`/verify-email${hash}`)
          return
        }
      }
    }
  }, [router])

  return (
    <main className="max-w-[1200px] mx-auto overflow-x-hidden">
      {/* Hero Section */}
      <section className="px-4 py-12 lg:py-20">
        <motion.div 
          className="flex flex-col lg:flex-row gap-12 items-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div className="flex flex-col gap-8 flex-1" variants={fadeInUp}>
            <div className="space-y-4">
              <motion.div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider"
                whileHover={{ scale: 1.05 }}
              >
                <i className="fas fa-shield-check text-sm"></i> Verified Talent Platform
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-primary dark:text-white"
                variants={fadeInUp}
              >
                The Smarter Way to Recruit, Train, and Deploy Agricultural Talent
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 dark:text-gray-300 max-w-xl"
                variants={fadeInUp}
              >
                Connecting verified graduates with modern farms in Ghana to build a stronger, tech-driven agricultural workforce.
              </motion.p>
            </div>
            <motion.div className="flex flex-wrap gap-4" variants={fadeInUp}>
              <Link 
                href="/for-graduates" 
                className="px-8 py-4 bg-accent text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 group"
              >
                Get Started <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </Link>
              <Link 
                href="#how-it-works" 
                className="px-8 py-4 border-2 border-primary/20 text-primary dark:text-white font-bold rounded-xl hover:bg-primary/5 transition-colors"
              >
                How It Works
              </Link>
            </motion.div>
          </motion.div>
          <motion.div 
            className="flex-1 w-full"
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div
              className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
              style={{
                backgroundImage:
                  `url('/Womanmobile.webp'), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAzJeSoH6PY8FpiY55M6yTwmRxQ5dEanQMdjBImBT3mU9oj2yRTYIhpF0_xyFyS5bMwPt1jl669U4M9IsMPtauvm-jG9mzB9DdWnbm3YcO_uWOtZQaX2stI3nHqTm046LNuOK79z8zbs4V9LHS60KwztP9gXRnmUigy7St1r3wouTpKS4rUrkVerqyHVWo6mGJ94H7ww0Ev6pbYXMyOsNpZAYGFag3cqWZYJg9CWJf18nTKkZkk4_KaTXwpVgM_oqsuQQfODaV1wxg")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="px-4 py-12 bg-primary/5 rounded-3xl mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '500+', label: 'Verified Graduates', icon: 'user-check' },
            { number: '100+', label: 'Partner Farms', icon: 'tractor' },
            { number: '95%', label: 'Placement Rate', icon: 'chart-line' },
            { number: '7 Days', label: 'Avg. Match Time', icon: 'clock' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="text-4xl font-black text-primary mb-2">
                <i className={`fas fa-${stat.icon} mr-2`}></i>
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Employer CTA: Post a Job */}
      <motion.section
        className="px-4 mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-primary border border-primary/20 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Hiring for your farm or business?
              </h2>
              <p className="text-white/90">
                Post a job in minutes. If you don’t have an Employer/Farm account yet, you’ll be asked to register first.
              </p>
            </div>
            <Link
              href="/post-job"
              className="inline-flex items-center justify-center rounded-xl h-12 px-6 bg-white text-primary font-bold hover:bg-white/90 transition-colors w-full md:w-auto"
            >
              Post a Job <i className="fas fa-arrow-right ml-2"></i>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works"
        className="px-4 py-16 bg-white dark:bg-background-dark"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            A simple, structured process connecting verified agricultural talent with modern farming opportunities across Ghana
          </motion.p>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {num: '01', title: 'Sign Up', icon: 'user-plus', desc: 'Create your profile and upload credentials'},
              {num: '02', title: 'Verification', icon: 'user-check', desc: 'We verify your degree and credentials'},
              {num: '03', title: 'Matching', icon: 'handshake', desc: 'AI matches you with suitable farms'},
              {num: '04', title: 'Training', icon: 'graduation-cap', desc: '2-week specialized boot camp'},
              {num: '05', title: 'Deployment', icon: 'tractor', desc: 'Start your professional journey'}
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto shadow-lg text-xl font-bold">
                    {step.num}
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <i className={`fas fa-${step.icon} text-accent`}></i>
                  </div>
                  {idx < 4 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary/20" style={{ width: 'calc(100% - 4rem)', marginLeft: '4rem' }}></div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-primary dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Trust Bar */}
      <motion.section 
        className="px-4 py-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {icon: 'verified_user', title: 'Verified Graduates'},
            {icon: 'location_on', title: 'Location-Based'},
            {icon: 'school', title: 'Quality Training'},
            {icon: 'support_agent', title: 'Expert Support'}
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex gap-4 rounded-xl border border-primary/10 bg-white dark:bg-white/5 p-5 items-center shadow-sm hover:shadow-lg transition-all cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <i className={`fas fa-${item.icon === 'verified_user' ? 'user-check' : item.icon === 'location_on' ? 'map-marker-alt' : item.icon === 'school' ? 'graduation-cap' : item.icon === 'support_agent' ? 'headset' : 'check-circle'}`}></i>
              </div>
              <h2 className="text-base font-bold">{item.title}</h2>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Job Postings Section */}
      <motion.section 
        className="px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-12 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Latest Job Opportunities
          </motion.h2>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Discover exciting agricultural career opportunities across Ghana
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {jobPostings.map((job, i) => (
            <motion.div
              key={job.id}
              className={`bg-white dark:bg-background-dark rounded-2xl border-2 p-6 shadow-lg transition-all cursor-pointer ${
                hoveredJob === job.id ? 'border-primary shadow-2xl scale-105' : 'border-primary/10'
              }`}
              onMouseEnter={() => setHoveredJob(job.id)}
              onMouseLeave={() => setHoveredJob(null)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary dark:text-white mb-1">{job.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{job.company}</p>
                </div>
                <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full">
                  {job.type}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-money-bill-wave text-primary"></i>
                  {job.salary}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-clock text-primary"></i>
                  {job.posted}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{job.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {job.requirements.slice(0, 2).map((req: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {req}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Apply Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
          >
            View All Jobs <i className="fas fa-arrow-right"></i>
          </Link>
        </motion.div>
      </motion.section>

      {/* Audience Section */}
      <motion.section 
        className="px-4 py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary dark:text-white">Tailored for Your Growth</h2>
          <p className="text-gray-600 dark:text-gray-400">Choose your path in the agricultural revolution.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            className="group flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-white/5 border border-primary/5 hover:border-primary/20 transition-all shadow-lg shadow-primary/5"
            whileHover={{ scale: 1.02, y: -5 }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-full aspect-video rounded-xl overflow-hidden relative" style={{backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAGNznEPrxWCuf7elCVh5Gv0WSp_50LmfAed2f-kyFKvmWXBhAkuA4j3szXKwF9cJ48vAEzhyGXqMor9BYKq0tdJxdw12l0XXnQpMKVATzDpKo6mO5cdBnfIktZaV-pEW-GZ-AoiC6mDQL6ofW8krhIppDk_7kj3rfTt1FNo0nFloYSlyolHztVyOi53XbpLK6pJPk9tuoBD0xtVUqCmvudP6kG2JadqlOs-8VPg-DI_eM6bXINiLHbuIvqMlCF0N1r0JjPPt5BcIU")`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary dark:text-white flex items-center gap-2">
                For Employers/Farms <i className="fas fa-tractor ml-2"></i>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Access top-tier verified talent for your business or agricultural operations. From field workers to specialized agronomists.</p>
              <Link href="/for-farms" className="inline-flex items-center text-accent font-bold group-hover:gap-2 transition-all">
                Learn More <i className="fas fa-arrow-right text-sm ml-1"></i>
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="group flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-white/5 border border-primary/5 hover:border-primary/20 transition-all shadow-lg shadow-primary/5"
            whileHover={{ scale: 1.02, y: -5 }}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div
              className="w-full aspect-video rounded-xl overflow-hidden relative"
              style={{
                backgroundImage:
                  `url('/farm_image_header.webp'), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCYrscz6_X_sPvmsTQyqwdQ8eEnRbkbfwJvyx-VZO15GGg5O1DI9ehkdZQ-e3ARAdLrqvAhARtJoDAVyaT_Dm4v_tlcKZU1qMeRFtoR4P_3GXv9OHXqfSvWEqtZcz3M4GKxuCKSYF1BnDzsJLRUZIaPxuFcdLERJi0cN0a9YpiebgWiQSiHK_u1MlIFX0Nc-xzv8a2HycZUJlw7rPaElVaq1QXr-YgXS8Ip3zQ8fq4E_xfM1M7VYbpZGdvTdFbwWQHes0g4F0AJ4wU")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary dark:text-white flex items-center gap-2">
                For Graduates <i className="fas fa-graduation-cap ml-2"></i>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Kickstart your career with internships, training opportunities, and placement with Ghana's leading modern farms.</p>
              <Link href="/for-graduates" className="inline-flex items-center text-accent font-bold group-hover:gap-2 transition-all">
                Learn More <i className="fas fa-arrow-right text-sm ml-1"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Parallax Feature Section */}
      <section
        className="px-4 py-16 my-8"
        style={{
          backgroundImage:
            `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url('/vast-farming-land.Bpd1NAnJ.webp'), url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-kElpTUoCgxWUirxX9dMta0fR1bBMMkehfQc_BrZFt4wPMh8Kma0iTMGyq4aQ1if9x3JJ5JJEjrqB4t4QRpIeDkFbYm7LWJo0B3LgQzRZAnAisupt--5TsBhrLhoFuVZgVyhQMahNR15haJER2gkGUqGcmjBqw7WzSvniZK9Tj1Wq3PTuErUo0kC5IdeU6urTyiXx_wM4oyFZMxSXHhe3lDTeFa6_7NpBKpKQ0RmtHlXFzHiOjdPUoWVhf34Rnlnt9-7yPiattGc')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10">
          <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm p-8 md:p-12 text-center">
            <h2 className="text-white text-3xl md:text-4xl font-black mb-4">
              Build a reliable workforce with verified talent
            </h2>
            <p className="text-white/90 text-lg max-w-3xl mx-auto mb-8">
              Regional-first matching, verification, and training records help employers and farms hire faster and onboard better.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/signup/farm"
                className="inline-flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                Register as Employer/Farm
              </a>
              <a
                href="/jobs"
                className="inline-flex items-center justify-center rounded-lg h-12 px-6 bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/20"
              >
                Browse Jobs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <motion.section 
        className="px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4">What Our Partners Say</h2>
          <p className="text-gray-600 dark:text-gray-400">Real stories from farms and graduates who've found success</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Kwame Asante',
              role: 'Farm Manager',
              company: 'Green Valley Farms',
              text: 'AgroTalent Hub connected us with three excellent graduates. The verification process gave us confidence, and the training they received made onboarding seamless.',
              rating: 5
            },
            {
              name: 'Ama Mensah',
              role: 'Recent Graduate',
              company: 'University of Ghana',
              text: 'I found my dream job within 2 weeks of signing up. The platform made it easy to connect with farms that matched my skills and interests.',
              rating: 5
            },
            {
              name: 'Dr. Kofi Boateng',
              role: 'Farm Owner',
              company: 'Modern Agro Solutions',
              text: 'The quality of candidates is outstanding. We\'ve hired 5 graduates through AgroTalent Hub, and each one has exceeded our expectations.',
              rating: 5
            }
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-background-dark p-6 rounded-2xl border border-primary/10 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, idx) => (
                  <i key={idx} className="fas fa-star text-accent text-sm"></i>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <i className="fas fa-user text-primary text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-primary dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Services Section */}
      <motion.section 
        className="px-4 py-16 bg-primary/5 rounded-3xl mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary dark:text-white">Our Comprehensive Services</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Everything you need to scale agricultural excellence.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {icon: 'person_search', title: 'Recruitment', desc: 'End-to-end matching of vetted workers with your farm\'s unique needs.', color: 'primary'},
            {icon: 'model_training', title: 'Training', desc: 'Upskilling programs focused on modern techniques and equipment.', color: 'accent'},
            {icon: 'work_history', title: 'Internships', desc: 'Bridging the gap between academic theory and real-world farm operations.', color: 'primary'},
            {icon: 'analytics', title: 'Data Collection', desc: 'Precision surveying and agricultural data gathering services.', color: 'accent'}
          ].map((s, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-primary/5 hover:-translate-y-1 transition-transform"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-12 h-12 ${s.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'} rounded-lg flex items-center justify-center mb-4`}>
                <i className={`fas fa-${s.icon === 'person_search' ? 'user-search' : s.icon === 'model_training' ? 'chalkboard-teacher' : s.icon === 'work_history' ? 'briefcase' : s.icon === 'analytics' ? 'chart-line' : 'check-circle'}`}></i>
              </div>
              <h4 className="text-lg font-bold mb-2">{s.title}</h4>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
  )
}
