'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'
import { SectionLabel } from '@/components/public/SectionLabel'
import {
  JobListingCard,
  type JobListingRow,
} from '@/components/public/JobListingCard'
import { createSupabaseClient } from '@/lib/supabase/client'

const supabase = createSupabaseClient()

const STEPS = [
  { n: 1, title: 'Sign Up', desc: 'Create your profile and upload credentials' },
  { n: 2, title: 'Verification', desc: 'Our team reviews documents for employer confidence' },
  { n: 3, title: 'Matching', desc: 'Smart matching connects talent to the right farms' },
  { n: 4, title: 'Training', desc: 'Orientation sessions prepare you for day one' },
  { n: 5, title: 'Deployment', desc: 'Start work with placement records and support' },
]

const FOR_WHO = [
  {
    title: 'Farms and Employers',
    desc: 'Hire verified graduates and skilled workers with structured placement workflows.',
    href: '/for-farms',
    image: '/Agriculture-Culture-in-Africa-Images.webp',
  },
  {
    title: 'Graduates',
    desc: 'Launch your agricultural career with roles matched to your training and region.',
    href: '/for-graduates',
    image: '/image_interns.jpg',
  },
  {
    title: 'Students (NSS and Interns)',
    desc: 'Access internships and national service placements with trusted partner farms.',
    href: '/for-students',
    image: '/Women_interns.webp',
  },
  {
    title: 'Skilled Workers',
    desc: 'Bring hands-on experience to farms that need practical expertise today.',
    href: '/for-skilled',
    image: '/Womanmobile.webp',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'AgroTalent Hub connected us with three excellent graduates. The verification process gave us confidence.',
    name: 'Kwame Asante',
    role: 'Farm Manager, Green Valley Farms',
    avatar: '/members/person5.webp',
  },
  {
    quote:
      'I found my dream job within 2 weeks of signing up. The platform made it easy to connect with farms matching my skills.',
    name: 'Ama Mensah',
    role: 'Graduate, University of Ghana',
    avatar: '/members/person3.webp',
  },
  {
    quote:
      'The quality of candidates is outstanding. Every graduate placed has exceeded our expectations.',
    name: 'Dr. Kofi Boateng',
    role: 'Farm Owner, Modern Agro Solutions',
    avatar: '/members/person4.webp',
  },
]

type JobRow = JobListingRow

function BtnArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function JobSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex justify-between gap-2">
        <div className="h-6 w-24 rounded-full bg-gray-200" />
        <div className="h-3 w-12 rounded bg-gray-200" />
      </div>
      <div className="h-5 w-4/5 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
      <div className="mt-4 h-10 w-full rounded-full bg-gray-200" />
    </div>
  )
}

export default function HomeClient() {
  const heroRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLElement>(null)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const queryJobs = async (withLogo: boolean) =>
        supabase
          .from('jobs')
          .select(
            withLogo
              ? `
          *,
          profiles!jobs_farm_id_fkey ( farm_name, is_verified, role, farm_logo_url )
        `
              : `
          *,
          profiles!jobs_farm_id_fkey ( farm_name, is_verified, role )
        `
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4)

      let { data, error } = await queryJobs(true)
      if (error?.message?.includes('farm_logo_url')) {
        const fallback = await queryJobs(false)
        data = fallback.data
        error = fallback.error
      }
      if (!cancelled) {
        if (!error && data?.length) setJobs(data as JobRow[])
        else setJobs([])
        setJobsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = heroRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.hero-label', { y: 20, opacity: 0, duration: 0.5 })
      tl.from(
        '.hero-line',
        { y: 40, opacity: 0, duration: 0.7, stagger: 0.12 },
        0
      )
      tl.from(
        '.hero-rating',
        { scale: 0.9, opacity: 0, duration: 0.5 },
        0.3
      )
      tl.from('.hero-sub', { opacity: 0, y: 20, duration: 0.5 }, 0.5)
      tl.from(
        '.hero-btn',
        { opacity: 0, y: 20, duration: 0.45, stagger: 0.06 },
        0.7
      )
      tl.from(
        '.hero-trust-item',
        { opacity: 0, y: 12, duration: 0.4, stagger: 0.06 },
        0.9
      )
      tl.from(
        '.hero-bottom-cards',
        { y: 60, opacity: 0, duration: 0.65, ease: 'power3.out' },
        0.8
      )
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = stepsRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.step-card', {
        opacity: 0,
        y: 28,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          once: true,
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <main className="font-ubuntu">
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden font-ubuntu"
      >
        <Image
          src="/farm_image_header.webp"
          alt="Farm background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-forest/75" aria-hidden />

        <div className="relative z-10 min-h-screen">
          <div className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-28 sm:pb-8">
            <div
              className="hero-rating z-20 hidden w-44 right-6 md:absolute md:right-20 md:top-28 md:block"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '20px',
                padding: '16px',
              }}
            >
              <p className="text-3xl font-bold text-white">
                4.9<span className="ml-1 text-xl text-white">★</span>
              </p>
              <p className="mt-1 text-xs text-white/80">1200+ Graduate Reviews</p>
              <div className="mt-3 pl-2">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {['/members/person1.webp', '/members/person2.webp', '/members/person3.webp', '/members/person4.webp'].map((src, i) => (
                    <div
                      key={src}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #1A6B3C',
                        marginLeft: i === 0 ? 0 : -8,
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      <Image src={src} alt="Member" fill className="object-cover" sizes="32px" />
                    </div>
                  ))}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid #1A6B3C',
                      marginLeft: -8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    +8
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-lg">
              <div className="hero-label">
                <SectionLabel>Ghana&apos;s #1 Agricultural Talent Platform</SectionLabel>
              </div>
              <h1 className="mt-5 font-bold leading-[1.1] text-white">
                <span className="hero-line block text-3xl md:text-5xl lg:text-6xl">
                  The Smarter Way to Recruit, Train, and Deploy Agricultural Talent
                </span>
              </h1>
              <p className="hero-sub mt-5 max-w-md text-base leading-relaxed text-white/65 md:text-lg">
                Connecting verified graduates, students, and skilled workers with
                modern farms across all 16 regions of Ghana.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/jobs"
                  className="hero-btn inline-flex items-center gap-2 rounded-full border-2 border-white/60 bg-forest px-6 py-3 font-bold text-white hover:bg-white/10"
                >
                  Find Jobs
                  <BtnArrow />
                </Link>
                <Link
                  href="/signup/farm"
                  className="hero-btn inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-transparent px-6 py-3 font-medium text-white hover:bg-white/10"
                >
                  Post a Job
                  <BtnArrow />
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-stretch gap-6 lg:mt-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex w-full items-center gap-6 pb-2 lg:max-w-md">
                {['500+ Verified Graduates', '100+ Partner Farms'].map((item) => {
                  const [num, ...rest] = item.split(' ')
                  return (
                    <div key={item} className="hero-trust-item flex items-baseline gap-1.5 whitespace-nowrap">
                      <div className="text-2xl font-bold leading-none text-white">{num}</div>
                      <div className="text-sm text-white/70">{rest.join(' ')}</div>
                    </div>
                  )
                })}
              </div>

              <div className="hero-bottom-cards flex w-full shrink-0 flex-wrap justify-end gap-4 lg:w-auto lg:flex-nowrap">
                <div className="w-full shrink-0 rounded-2xl bg-white p-4 shadow-xl sm:w-64">
                  <h3 className="text-sm font-bold text-forest">Farm Manager Placement</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Verified graduates matched to your farm region
                  </p>
                  <Link
                    href="/jobs"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    View Details
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="w-full shrink-0 rounded-2xl bg-white p-4 shadow-xl sm:w-64">
                  <h3 className="text-sm font-bold text-forest">Graduate Placement</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Match with farms in your preferred region today
                  </p>
                  <Link
                    href="/for-graduates"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Explore More
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={stepsRef} className="bg-white px-6 py-12 md:py-20">
        <div className="flex justify-center">
          <SectionLabel>THE PROCESS</SectionLabel>
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold text-forest md:text-4xl">
          From Registration to Placement in 5 Steps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          A guided journey from signup to your first day on the farm.
        </p>
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            className="pointer-events-none absolute left-[10%] right-[10%] top-8 hidden border-t-2 border-dashed border-gray-200 md:block"
            aria-hidden
          />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="step-card relative z-10 mx-auto w-full max-w-sm text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand/20 bg-brand/10 text-2xl font-bold text-brand">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-bold text-forest">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[140px] text-sm text-gray-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-12 md:py-20">
        <div className="flex justify-center">
          <SectionLabel>BUILT FOR AGRICULTURE</SectionLabel>
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold text-forest md:text-4xl">
          A Platform For Every Role
        </h2>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          {FOR_WHO.map((c) => (
            <Link href={c.href} key={c.title}>
              <div className="group relative h-64 cursor-pointer overflow-hidden rounded-2xl">
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-forest/60 transition-colors group-hover:bg-forest/70" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    {c.desc}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                    Learn More
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-12 md:py-20">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold text-forest md:text-3xl">Latest Opportunities</h2>
          <Link
            href="/jobs"
            className="inline-flex w-fit items-center rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            View All Jobs
          </Link>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {jobsLoading
            ? [0, 1, 2, 3].map((k) => <JobSkeleton key={k} />)
            : jobs.map((job) => (
                <JobListingCard key={job.id} job={job} compact />
              ))}
        </div>
        {!jobsLoading && jobs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">
            No active listings right now. Check back soon.
          </p>
        ) : null}
      </section>

      <section className="bg-cream px-6 py-12 md:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative h-80 w-full overflow-hidden rounded-2xl">
            <Image
              src="/Women_interns.webp"
              alt="Women interns in agriculture"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <SectionLabel>VERIFIED TALENT</SectionLabel>
            <h2 className="mt-3 text-xl font-bold text-forest md:text-3xl">
              Every Candidate is Verified Before Placement
            </h2>
            <p className="mt-4 text-gray-500">
              We review credentials and readiness so farms can hire with clarity
              and candidates can show up prepared.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Structured document checks for certificates and references',
                'Profiles aligned to real farm roles and regions',
                'Clear verification status before you shortlist',
              ].map((line) => (
                <li key={line} className="flex gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <SectionLabel>LOCATION MATCHING</SectionLabel>
            <h2 className="mt-3 text-xl font-bold text-forest md:text-3xl">
              Location-First Matching Algorithm
            </h2>
            <p className="mt-4 text-gray-500">
              Location accounts for 50 points of every match score. We prioritize
              candidates who are already in the same region as the farm.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Regional fit reduces relocation friction',
                'Employers see proximity-sorted shortlists',
                'Workers discover roles where they want to live',
              ].map((line) => (
                <li key={line} className="flex gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-1 h-80 w-full overflow-hidden rounded-2xl md:order-2">
            <Image
              src="/vast-farming-land.Bpd1NAnJ.webp"
              alt="Farming landscape"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-forest px-6 py-12 md:py-20">
        <h2 className="mb-12 text-center text-2xl font-bold text-white md:text-4xl">
          What Our Partners Say
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/10 bg-white/8 p-8"
            >
              <p className="text-6xl font-bold leading-none text-gold">&quot;</p>
              <p className="mt-2 text-sm italic leading-relaxed text-white/80">
                {t.quote}
              </p>
              <div className="mt-6 flex items-center">
                <div
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gold">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-12 md:py-20">
        <h2 className="mb-10 text-center text-xl font-bold text-forest md:text-3xl">
          Real Farms. Real People. Real Placements.
        </h2>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 md:grid md:h-[480px] md:grid-cols-3 md:grid-rows-2">
          <div className="relative aspect-[4/3] h-full w-full overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:aspect-auto">
            <Image
              src="/plantainfarm.jpg"
              alt="Plantain farm"
              fill
              className="object-cover"
              sizes="66vw"
            />
          </div>
          <div className="relative aspect-video h-full w-full overflow-hidden rounded-2xl md:col-start-3 md:row-start-1 md:aspect-auto">
            <Image
              src="/image_interns.webp"
              alt="Interns"
              fill
              className="object-cover"
              sizes="33vw"
            />
          </div>
          <div className="relative aspect-video h-full w-full overflow-hidden rounded-2xl md:col-start-3 md:row-start-2 md:aspect-auto">
            <Image
              src="/greenhouse-lady.jpg"
              alt="Greenhouse"
              fill
              className="object-cover"
              sizes="33vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-12 text-center md:py-16">
        <h2 className="mb-8 text-xl font-bold text-forest md:text-2xl">
          Contributing to the UN Sustainable Development Goals
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { n: 1, label: 'No Poverty' },
            { n: 2, label: 'Zero Hunger' },
            { n: 4, label: 'Quality Education' },
            { n: 8, label: 'Decent Work' },
            { n: 10, label: 'Reduced Inequalities' },
          ].map((s) => (
            <div key={s.n} className="flex w-[88px] flex-col items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={`/Sustainable_Development_Goal_${s.n}.webp`}
                  alt={s.label}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </div>
              <p className="mx-auto mt-2 max-w-[80px] text-center text-xs text-gray-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="bg-brand px-6 py-12 md:py-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold leading-tight text-white md:text-4xl">
            Ready to Join Ghana&apos;s Agricultural Revolution?
          </h2>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            Whether you are launching a career or scaling a farm team, we are
            here to help you move faster with confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup/graduate"
              className="rounded-full bg-white px-8 py-4 font-bold text-brand hover:bg-cream"
            >
              Get Started as a Graduate
            </Link>
            <Link
              href="/signup/farm"
              className="rounded-full border-2 border-white/40 px-8 py-4 font-medium text-white hover:bg-white/10"
            >
              Register Your Farm
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
