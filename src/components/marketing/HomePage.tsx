'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getInitials } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

type PublicJob = {
  id: string
  title: string
  job_type: string
  location: string
  city?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  is_platform_job?: boolean | null
  profiles?:
    | {
        farm_name?: string | null
        full_name?: string | null
        role?: string | null
        farm_logo_url?: string | null
      }
    | {
        farm_name?: string | null
        full_name?: string | null
        role?: string | null
        farm_logo_url?: string | null
      }[]
    | null
}

const STEPS = [
  {
    title: 'Sign Up',
    desc: 'Create your profile and upload your credentials. Graduates, students, and skilled workers each have their own onboarding path.',
  },
  {
    title: 'Verification',
    desc: 'Our team reviews your documents to ensure employer confidence. Verified badges unlock priority placement consideration.',
  },
  {
    title: 'AI Matching',
    desc: 'Our location-first algorithm scores every candidate against each job: region, skills, experience, and availability all factor in.',
  },
  {
    title: 'Training',
    desc: 'Shortlisted candidates gain access to curated training sessions that prepare them for farm life and employer expectations.',
  },
  {
    title: 'Deployment',
    desc: 'Placed workers start work with full employer support, verified contracts, and ongoing check-ins from the AgroTalentHub team.',
  },
] as const

const ROLE_CARDS = [
  {
    href: '/for-farms',
    image: '/plantainfarm.jpg',
    pill: 'FARMS & EMPLOYERS',
    title: 'Post Jobs. Find Vetted Talent.',
    sub: "Access Ghana's largest agricultural candidate pool.",
  },
  {
    href: '/for-graduates',
    image: '/greenhouse-lady.jpg',
    pill: 'GRADUATES',
    title: 'Launch Your Agric Career.',
    sub: 'Match with farms that value your qualification.',
  },
  {
    href: '/for-students',
    image: '/image_interns.webp',
    pill: 'STUDENTS & INTERNS',
    title: 'Build Experience Early.',
    sub: 'Get placed with trusted partner farms.',
  },
  {
    href: '/for-skilled',
    image: '/sacking.jpg',
    pill: 'SKILLED WORKERS',
    title: 'Find Roles That Fit.',
    sub: 'Discover opportunities across all 16 regions.',
  },
] as const

// Avatar paths: visually confirm /members/person*.webp match intended gender before changing.
const TESTIMONIALS = [
  {
    quote:
      'AgroTalentHub connected us with three excellent farm managers in under 2 weeks. The verification platform gives us real confidence.',
    name: 'Emelia Agbagedi',
    role: 'Farm Operations · Volta',
    avatar: '/members/person1.webp',
    placedPill: true,
  },
  {
    quote:
      'I found my dream job within 2 weeks of signing up. The platform made it easy to connect with farms that matched my skills.',
    name: 'Ama Mensah',
    role: 'Graduate · Ashanti',
    avatar: '/members/person3.webp',
  },
  {
    quote:
      'The quality of candidates is outstanding. Every graduate placed has exceeded our expectations.',
    name: 'Dr. Kofi Boateng',
    role: 'Farm Operations Director',
    avatar: '/members/person2.webp',
  },
] as const

const MOSAIC = [
  { src: '/ghana_5.jpg', h: 'h-64' },
  { src: '/Agribusiness.jpg', h: 'h-48' },
  { src: '/Women_interns.webp', h: 'h-48' },
  { src: '/large_photo_data_collection.jpg', h: 'h-64' },
] as const

// Verify filenames in /public if SDG assets change (Sustainable_Development_Goal_*.webp).
const SDG_FILES = [
  '/Sustainable_Development_Goal_1.webp',
  '/Sustainable_Development_Goal_2.webp',
  '/Sustainable_Development_Goal_4.webp',
  '/Sustainable_Development_Goal_8.webp',
] as const

const JOB_TYPE_LABEL: Record<string, string> = {
  farm_hand: 'Farm Hand',
  farm_manager: 'Farm Manager',
  intern: 'Internship',
  nss: 'NSS',
  data_collector: 'Data Collector',
}

function profileOne(
  p: PublicJob['profiles']
): {
  farm_name?: string | null
  full_name?: string | null
  role?: string | null
  farm_logo_url?: string | null
} | null {
  if (!p) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

function posterDisplayLabel(job: PublicJob): string {
  if (job.is_platform_job) return 'AgroTalent Hub'
  const pr = profileOne(job.profiles)
  if (!pr) return 'Farm'
  if (pr.role === 'farm') {
    return pr.farm_name?.trim() || 'Farm'
  }
  return pr.farm_name?.trim() || pr.full_name?.trim() || 'Farm'
}

/** One line for hero float card: place · salary (matches “Latest Opportunities” semantics). */
function heroJobSubline(job: PublicJob): string {
  const city = job.city?.trim()
  const loc = job.location?.trim()
  const place =
    city && loc && city !== loc ? `${city} · ${loc}` : (city || loc || 'Ghana')
  if (job.salary_min != null) {
    const cur = job.salary_currency ?? 'GHS'
    const amt =
      job.salary_max != null
        ? `${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}`
        : job.salary_min.toLocaleString()
    return `${place} · ${cur} ${amt}/mo`
  }
  return place
}

export default function HomePage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<PublicJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [heroSearch, setHeroSearch] = useState('')

  const handleHeroSearch = () => {
    const term = heroSearch.trim()
    if (term) {
      router.push('/jobs?search=' + encodeURIComponent(term))
    } else {
      router.push('/jobs')
    }
  }

  const heroRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const rolesRef = useRef<HTMLDivElement>(null)
  const jobsRef = useRef<HTMLDivElement>(null)
  const featRowARef = useRef<HTMLDivElement>(null)
  const featRowBRef = useRef<HTMLDivElement>(null)
  const testRef = useRef<HTMLDivElement>(null)
  const mosaicRef = useRef<HTMLDivElement>(null)
  const sdgRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(
          /\/$/,
          ''
        )
        const res = await fetch(`${base}/api/jobs/public?limit=4`)
        const json = (await res.json()) as { jobs?: PublicJob[] }
        if (!cancelled && res.ok && Array.isArray(json.jobs)) {
          setJobs(json.jobs as PublicJob[])
        } else if (!cancelled) {
          setJobs([])
        }
      } catch {
        if (!cancelled) setJobs([])
      } finally {
        if (!cancelled) setJobsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = heroRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      gsap.from('.hero-left-stagger > *', {
        opacity: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      })
      gsap.from('.hero-right-image', {
        opacity: 0,
        x: 60,
        duration: 0.9,
        delay: 0.3,
        ease: 'power3.out',
      })
      gsap.from('.hero-float-a', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        delay: 0.7,
        ease: 'power3.out',
      })
      gsap.from('.hero-float-b', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        delay: 0.9,
        ease: 'power3.out',
      })
      gsap.from('.hero-float-c', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        delay: 1.1,
        ease: 'power3.out',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = trustRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.trust-animate', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    const ctx = gsap.context(() => {
        gsap.from('.timeline-step-node-desktop', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = rolesRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.role-card', {
        opacity: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = jobsRef.current
    if (!el || jobsLoading || jobs.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.home-job-card', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [jobsLoading, jobs.length])

  useEffect(() => {
    const a = featRowARef.current
    const b = featRowBRef.current
    const ctx = gsap.context(() => {
      if (a) {
        gsap.from('.feat-a-content', {
          opacity: 0,
          x: -40,
          duration: 0.65,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: a,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
        gsap.from('.feat-a-img', {
          opacity: 0,
          x: 40,
          duration: 0.65,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: a,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
      }
      if (b) {
        gsap.from('.feat-b-img', {
          opacity: 0,
          x: -40,
          duration: 0.65,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: b,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
        gsap.from('.feat-b-content', {
          opacity: 0,
          x: 40,
          duration: 0.65,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: b,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
      }
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = testRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.testimonial-home-card', {
        opacity: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.12,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = mosaicRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.mosaic-cell', {
        opacity: 0,
        scale: 0.96,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = sdgRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.sdg-thumb', {
        opacity: 0,
        y: 12,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.cta-inner', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  const latestJob = jobs[0]

  return (
    <div className='bg-[#F8F7F2]'>
      <section
        ref={heroRef}
        className='relative min-h-screen overflow-x-hidden bg-[#FDF6EC] lg:bg-[#FDF6EC] lg:grid lg:grid-cols-2 lg:items-stretch'
      >
        <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden lg:hidden'>
          {/* Plain img: serves directly from /public (no /_next/image). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/responsive.jpg'
            alt=''
            width={1200}
            height={1600}
            decoding='async'
            fetchPriority='high'
            className='absolute inset-0 h-full w-full object-cover object-center'
          />
        </div>
        <div
          className='pointer-events-none absolute inset-0 z-[1] bg-[#FDF6EC]/55 lg:hidden'
          aria-hidden='true'
        />
        <div className='hero-left-stagger relative z-10 flex flex-col justify-center px-6 py-20 lg:px-16 lg:py-0'>
          <div className='flex items-center gap-2'>
            <span className='h-2 w-2 animate-pulse rounded-full bg-[#8BC34A]' aria-hidden />
            <span className='text-[12px] font-medium uppercase tracking-widest text-[#2E7D32]'>
              Ghana&apos;s #1 Agricultural Talent Platform
            </span>
          </div>
          <div className='font-ubuntu mt-4 text-[38px] font-extrabold leading-[1.1] text-[#0F1A0E] lg:text-[58px]'>
            <p>Find. Place. Grow.</p>
            <p className='text-[#2E7D32]'>Agricultural Talent</p>
            <p>Across Ghana.</p>
          </div>
          <p className='mt-5 max-w-md text-[17px] font-normal leading-relaxed text-[#374151]'>
            Connecting verified graduates, skilled workers, and farm employers across all 16
            regions of Ghana.
          </p>
          <div className='mt-8 flex max-w-md items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg'>
            <MapPin className='h-5 w-5 shrink-0 text-[#2E7D32]' aria-hidden />
            <input
              type='search'
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleHeroSearch()
              }}
              placeholder='Search jobs, farms, regions...'
              className='flex-1 bg-transparent text-sm text-[#374151] outline-none'
              aria-label='Search jobs'
            />
            <button
              type='button'
              onClick={handleHeroSearch}
              className='rounded-xl bg-[#2E7D32] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1B5E20]'
            >
              <>
                <Search className='h-5 w-5 sm:hidden' />
                <span className='hidden sm:inline'>Search Jobs</span>
              </>
            </button>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => router.push('/jobs?type=graduate')}
              className='cursor-pointer rounded-full border border-[#2E7D32]/30 px-4 py-1.5 text-xs text-[#2E7D32]'
            >
              For Graduates
            </button>
            <button
              type='button'
              onClick={() => router.push('/jobs?type=skilled')}
              className='cursor-pointer rounded-full border border-[#2E7D32]/30 px-4 py-1.5 text-xs text-[#2E7D32]'
            >
              For Skilled Workers
            </button>
          </div>
          <div className='mt-10 max-w-md border-t border-[#1B5E20]/20 pt-6'>
            <div className='rounded-2xl bg-white/92 px-2.5 py-3 shadow-sm ring-1 ring-black/[0.06] backdrop-blur-sm sm:px-5 sm:py-6'>
              <ul className='flex flex-row items-stretch divide-x divide-[#E5E7EB]'>
                <li className='flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-center sm:gap-2 sm:px-3 sm:py-1'>
                  <div
                    className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F7EE] ring-1 ring-[#8BC34A]/35 sm:h-10 sm:w-10'
                    aria-hidden
                  >
                    <BarChart2 className='h-3.5 w-3.5 text-[#2E7D32] sm:h-5 sm:w-5' strokeWidth={2} />
                  </div>
                  <span className='font-ubuntu text-lg font-bold leading-none text-[#1B5E20] sm:text-2xl'>
                    500+
                  </span>
                  <span className='font-ubuntu text-[8px] font-semibold uppercase leading-tight tracking-tight text-[#374151] sm:mt-0.5 sm:text-[10px] sm:tracking-wide'>
                    Verified Candidates
                  </span>
                </li>
                <li className='flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-center sm:gap-2 sm:px-3 sm:py-1'>
                  <div
                    className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F7EE] ring-1 ring-[#8BC34A]/35 sm:h-10 sm:w-10'
                    aria-hidden
                  >
                    <BarChart2 className='h-3.5 w-3.5 text-[#2E7D32] sm:h-5 sm:w-5' strokeWidth={2} />
                  </div>
                  <span className='font-ubuntu text-lg font-bold leading-none text-[#1B5E20] sm:text-2xl'>
                    100+
                  </span>
                  <span className='font-ubuntu text-[8px] font-semibold uppercase leading-tight tracking-tight text-[#374151] sm:mt-0.5 sm:text-[10px] sm:tracking-wide'>
                    Partner Farms
                  </span>
                </li>
                <li className='flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-center sm:gap-2 sm:px-3 sm:py-1'>
                  <div
                    className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F7EE] ring-1 ring-[#8BC34A]/35 sm:h-10 sm:w-10'
                    aria-hidden
                  >
                    <BarChart2 className='h-3.5 w-3.5 text-[#2E7D32] sm:h-5 sm:w-5' strokeWidth={2} />
                  </div>
                  <span className='font-ubuntu text-lg font-bold leading-none text-[#1B5E20] sm:text-2xl'>
                    16
                  </span>
                  <span className='font-ubuntu text-[8px] font-semibold uppercase leading-tight tracking-tight text-[#374151] sm:mt-0.5 sm:text-[10px] sm:tracking-wide'>
                    Regions Covered
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='relative hidden h-screen max-h-[700px] lg:block'>
          <div className='hero-right-image relative h-[600px] w-full overflow-hidden rounded-tl-3xl rounded-bl-3xl rounded-tr-none rounded-br-none'>
            <Image
              src='/vast-farming-land.Bpd1NAnJ.webp'
              alt='Farm landscape'
              fill
              priority
              className='object-cover'
              sizes='50vw'
            />
            <div
              className='pointer-events-none absolute inset-0 rounded-tl-3xl rounded-bl-3xl rounded-tr-none rounded-br-none bg-gradient-to-t from-black/50 via-transparent to-transparent'
              aria-hidden
            />
          </div>
          <div className='hero-float-a absolute left-[-2.5rem] top-[30%] z-10 w-52 rounded-2xl bg-white p-3 shadow-xl'>
            {/* Visually verify person1.webp reads as female; swap to another /members/person*.webp if not. */}
            <div className='flex items-start gap-2'>
              <div className='relative h-9 w-9 shrink-0 overflow-hidden rounded-full'>
                <Image
                  src='/members/person1.webp'
                  alt=''
                  fill
                  className='object-cover'
                  sizes='36px'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[13px] font-semibold text-[#0F1A0E]'>Emelia Agbagedi</p>
                <p className='text-[11px] text-[#6B7280]'>Farm Operations · Volta</p>
                <span className='mt-1 inline-block w-fit rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-medium text-[#2E7D32]'>
                  ✓ Placed
                </span>
              </div>
            </div>
          </div>
          <div className='hero-float-b absolute bottom-[10%] right-4 z-10 w-44 rounded-2xl bg-white p-3 shadow-xl'>
            <p className='text-[10px] font-semibold uppercase text-[#8BC34A]'>NEW POSTING</p>
            {jobsLoading ? (
              <>
                <div className='mt-1 h-4 w-[85%] animate-pulse rounded bg-gray-200' />
                <div className='mt-1.5 h-3 w-full animate-pulse rounded bg-gray-100' />
                <span className='mt-2 inline-block w-fit rounded-lg bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-transparent'>
                  View
                </span>
              </>
            ) : latestJob ? (
              <>
                <p className='mt-0.5 line-clamp-2 text-[13px] font-semibold text-[#0F1A0E]'>
                  {latestJob.title}
                </p>
                <p className='mt-0.5 line-clamp-2 text-[11px] text-[#6B7280]'>
                  {heroJobSubline(latestJob)}
                </p>
                <Link
                  href={'/jobs/' + latestJob.id}
                  className='mt-2 inline-block w-fit rounded-lg bg-[#2E7D32] px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-[#1B5E20]'
                >
                  View
                </Link>
              </>
            ) : (
              <>
                <p className='mt-0.5 text-[13px] font-semibold text-[#0F1A0E]'>Roles across Ghana</p>
                <p className='mt-0.5 text-[11px] text-[#6B7280]'>Browse open positions</p>
                <Link
                  href='/jobs'
                  className='mt-2 inline-block w-fit rounded-lg bg-[#2E7D32] px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-[#1B5E20]'
                >
                  View
                </Link>
              </>
            )}
          </div>
          <div className='hero-float-c absolute right-6 top-8 z-10 flex items-center gap-2 rounded-2xl bg-white p-2.5 shadow-md'>
            <Star className='h-4 w-4 shrink-0 text-[#F59E0B]' aria-hidden />
            <span className='font-sora text-[13px] font-bold text-[#0F1A0E]'>4.9</span>
            <span className='text-[11px] text-[#6B7280]'>/ 1,200+ Reviews</span>
          </div>
        </div>
      </section>

      <section
        ref={trustRef}
        className='border-y border-[#C8E6C9] bg-[#F0F7EE] py-4'
      >
        <div className='trust-animate mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-y-2 px-4 text-center text-[13px] text-[#2E7D32]'>
          <span>Trusted by farms and graduates across · </span>
          {['Greater Accra', 'Ashanti', 'Brong-Ahafo', 'Eastern Region'].map((r) => (
            <span
              key={r}
              className='mx-1 inline-flex rounded-full border border-[#C8E6C9] bg-white px-3 py-0.5 text-[12px]'
            >
              {r}
            </span>
          ))}
          <span className='mx-1 inline-flex rounded-full border border-[#C8E6C9] bg-white px-3 py-0.5 text-[12px]'>
            + 12 more regions
          </span>
        </div>
      </section>

      <section className='bg-[#0F2010] py-24 text-white'>
        <p className='text-center text-[11px] font-medium uppercase tracking-widest text-[#8BC34A]'>
          HOW IT WORKS
        </p>
        <h2 className='font-ubuntu mx-auto mt-2 max-w-2xl text-center text-[40px] font-bold text-white'>
          From Registration to Placement in 5 Steps
        </h2>
        <p className='mx-auto mt-3 max-w-xl text-center text-[15px] text-[#9CA3AF]'>
          A structured journey from sign-up to your first day on the farm.
        </p>

        <div ref={timelineRef} className='relative mx-auto mt-16 hidden max-w-3xl md:block'>
          <div
            className='absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[#2E7D32]/40'
            aria-hidden
          />
          {STEPS.map((s, i) => {
            const odd = i % 2 === 0
            const node = (
              <div className='relative z-10 flex w-10 shrink-0 justify-center'>
                <div className='timeline-step-node-desktop flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#8BC34A] bg-[#1B5E20] font-sora text-[14px] font-bold text-[#8BC34A]'>
                  {i + 1}
                </div>
              </div>
            )
            const body = (
              <div className={odd ? 'w-5/12 shrink-0 pr-8 text-right' : 'w-5/12 shrink-0 pl-8 text-left'}>
                <h3 className='font-ubuntu text-[19px] font-semibold text-white'>{s.title}</h3>
                <p className='mt-2 text-[14px] leading-relaxed text-[#9CA3AF]'>{s.desc}</p>
              </div>
            )
            return (
              <div key={s.title} className='relative mb-16 flex w-full items-start last:mb-0'>
                {odd ? (
                  <>
                    {body}
                    {node}
                    <div className='w-5/12 shrink-0' />
                  </>
                ) : (
                  <>
                    <div className='w-5/12 shrink-0' />
                    {node}
                    {body}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className='relative mx-auto mt-16 max-w-lg border-l-2 border-[#2E7D32]/40 pl-6 md:hidden'>
          {STEPS.map((s, i) => (
            <div key={s.title} className='mb-10 last:mb-0'>
              <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#8BC34A] bg-[#1B5E20] font-sora text-[14px] font-bold text-[#8BC34A]'>
                {i + 1}
              </div>
              <h3 className='font-ubuntu text-[19px] font-semibold text-white'>{s.title}</h3>
              <p className='mt-2 text-[14px] leading-relaxed text-[#9CA3AF]'>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className='mx-auto mt-8 flex max-w-2xl flex-col items-stretch justify-between gap-4 rounded-2xl bg-[#8BC34A] px-8 py-5 sm:flex-row sm:items-center'>
          <p className='text-center text-[15px] font-semibold text-[#0F1A0E] sm:text-left'>
            Ready to begin your journey?
          </p>
          <Link
            href='/jobs'
            className='rounded-xl bg-[#0F2010] px-5 py-2.5 text-center text-[14px] font-semibold text-white sm:shrink-0'
          >
            Explore Opportunities
          </Link>
        </div>
      </section>

      <section ref={rolesRef} className='bg-[#F8F7F2] py-24'>
        <p className='text-center text-[11px] font-medium uppercase tracking-widest text-[#2E7D32]'>
          BUILT FOR YOU
        </p>
        <h2 className='font-ubuntu mt-2 text-center text-[38px] font-bold text-[#0F1A0E]'>
          A Platform For Every Role
        </h2>
        <div className='mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2'>
          {ROLE_CARDS.map((c) => (
            <Link key={c.href} href={c.href} className='role-card group relative block h-64 overflow-hidden rounded-3xl'>
              <Image
                src={c.image}
                alt=''
                fill
                className='object-cover transition-transform duration-500 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
              <div className='absolute bottom-0 left-0 p-6'>
                <span className='inline-block rounded-full border border-gray-200 bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#2E7D32] shadow-sm'>
                  {c.pill}
                </span>
                <h3 className='font-ubuntu mt-2 text-[22px] font-bold leading-snug text-white'>
                  {c.title}
                </h3>
                <p className='mt-1 text-[13px] text-white/70'>{c.sub}</p>
                <p className='mt-2 text-[13px] text-[#8BC34A]'>Learn More →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section ref={jobsRef} className='bg-white py-24'>
        <div className='mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 sm:flex-row sm:items-center lg:px-8'>
          <h2 className='font-ubuntu text-[30px] font-bold text-[#0F1A0E]'>Latest Opportunities</h2>
          <Link
            href='/jobs'
            className='flex items-center gap-1 text-[14px] font-semibold text-[#2E7D32]'
          >
            View All Jobs
            <ChevronRight className='h-4 w-4' aria-hidden />
          </Link>
        </div>
        <div className='mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8'>
          {jobsLoading
            ? [0, 1, 2, 3].map((k) => (
                <div
                  key={k}
                  className='h-52 animate-pulse rounded-2xl bg-gray-100'
                />
              ))
            : jobs.map((job) => {
                const pr = profileOne(job.profiles)
                const farmLogoUrl = pr?.farm_logo_url?.trim()
                return (
                  <div
                    key={job.id}
                    className='home-job-card flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div
                        className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xs font-bold text-gray-500'
                        aria-hidden
                      >
                        {job.is_platform_job ? (
                          <Image
                            src='/agrotalent-logo.webp'
                            alt='AgroTalent Hub'
                            width={28}
                            height={28}
                            className='rounded-full object-cover'
                          />
                        ) : farmLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={farmLogoUrl}
                            alt=''
                            className='h-8 w-8 rounded-full object-cover'
                          />
                        ) : (
                          getInitials(posterDisplayLabel(job))
                        )}
                      </div>
                      <span className='rounded-full bg-[#F0F7EE] px-2.5 py-0.5 text-xs font-semibold text-[#2E7D32]'>
                        {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
                      </span>
                    </div>
                    <h3 className='font-ubuntu line-clamp-2 text-[16px] font-semibold text-[#0F1A0E]'>
                      {job.title}
                    </h3>
                    <p className='text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8963E]'>
                      {posterDisplayLabel(job)}
                    </p>
                    <p className='flex items-center gap-1 text-[13px] text-[#374151]'>
                      <MapPin className='h-3.5 w-3.5 shrink-0 text-[#2E7D32]' aria-hidden />
                      {job.city ? job.city + ', ' : ''}
                      {job.location}
                    </p>
                    {job.salary_min != null ? (
                      <p className='flex items-center gap-1 text-[13px] text-[#374151]'>
                        <Banknote className='h-3.5 w-3.5 shrink-0 text-[#2E7D32]' aria-hidden />
                        {job.salary_currency ?? 'GHS'}{' '}
                        {job.salary_min.toLocaleString()}
                        {job.salary_max != null ? '-' + job.salary_max.toLocaleString() : ''}
                        /mo
                      </p>
                    ) : null}
                    <button
                      type='button'
                      onClick={() => router.push('/jobs/' + job.id)}
                      className='mt-auto flex w-full items-center justify-center rounded-full bg-[#2E7D32] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#1B5E20]'
                    >
                      View Details
                    </button>
                  </div>
                )
              })}
        </div>
      </section>

      <div ref={featRowARef} className='bg-[#F8F7F2] px-6 py-20 lg:px-24'>
        <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2'>
          <div className='feat-a-content'>
            <p className='text-[11px] font-medium uppercase tracking-widest text-[#2E7D32]'>
              VERIFIED TALENT
            </p>
            <h2 className='font-ubuntu mt-2 text-[34px] font-bold text-[#0F1A0E]'>
              Every Candidate is Verified Before Placement.
            </h2>
            <p className='mt-4 max-w-sm text-[15px] leading-relaxed text-[#374151]'>
              We check qualifications, work history, and references so farms hire with confidence.
            </p>
            <ul className='mt-3 flex flex-col gap-2'>
              {[
                'Document checks for certificates and references',
                'Expert review of each application',
                'Profile verified before you shortlist',
              ].map((line) => (
                <li key={line} className='flex items-start gap-2 text-[14px] text-[#374151]'>
                  <ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-[#2E7D32]' aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className='feat-a-img relative h-80 w-full overflow-hidden rounded-2xl'>
            <Image
              src='/greenhouseman.jpg'
              alt=''
              fill
              className='object-cover'
              sizes='(max-width: 1024px) 100vw, 50vw'
            />
          </div>
        </div>
      </div>

      <div ref={featRowBRef} className='bg-white px-6 py-20 lg:px-24'>
        <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2'>
          <div className='feat-b-img relative order-2 h-80 w-full overflow-hidden rounded-2xl lg:order-1'>
            <Image
              src='/vegetable-field.jpg'
              alt=''
              fill
              className='object-cover'
              sizes='(max-width: 1024px) 100vw, 50vw'
            />
          </div>
          <div className='feat-b-content order-1 lg:order-2'>
            <p className='text-[11px] font-medium uppercase tracking-widest text-[#2E7D32]'>
              LOCATION MATCHING
            </p>
            <h2 className='font-ubuntu mt-2 text-[34px] font-bold text-[#0F1A0E]'>
              Location-First Matching Algorithm.
            </h2>
            <p className='mt-4 max-w-sm text-[15px] leading-relaxed text-[#374151]'>
              Location accounts for 40 points of every match score. We prioritise candidates already
              in the same region as the farm.
            </p>
            <ul className='mt-3 flex flex-col gap-2'>
              {[
                'No more relocation friction',
                'Employers see only suited matches',
                'Workers choose roles where they want to live',
              ].map((line) => (
                <li key={line} className='flex items-start gap-2 text-[14px] text-[#374151]'>
                  <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-[#2E7D32]' aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <section ref={testRef} className='bg-[#0F2010] py-24'>
        <p className='text-center text-[11px] font-medium uppercase tracking-widest text-[#8BC34A]'>
          WHAT OUR PARTNERS SAY
        </p>
        <h2 className='font-ubuntu mt-2 text-center text-[34px] font-bold text-white'>
          Real Farms. Real People. Real Placements.
        </h2>
        <div className='mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-3 lg:px-8'>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className='testimonial-home-card rounded-2xl border border-[#2E7D32]/20 bg-[#1B3A1A] p-6'
            >
              <p className='font-sora -mb-3 text-[72px] font-bold leading-none text-[#8BC34A]/30'>
                &quot;
              </p>
              <p className='text-[15px] leading-relaxed text-[#D1FAE5]'>{t.quote}</p>
              <div className='mt-5 flex items-center gap-3'>
                <div className='relative h-9 w-9 shrink-0 overflow-hidden rounded-full'>
                  <Image src={t.avatar} alt='' fill className='object-cover' sizes='36px' />
                </div>
                <div>
                  <p className='text-[13px] font-semibold text-white'>{t.name}</p>
                  <p className='text-[12px] text-[#9CA3AF]'>{t.role}</p>
                  {'placedPill' in t && t.placedPill ? (
                    <span className='mt-1 inline-block w-fit rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-medium text-[#2E7D32]'>
                      ✓ Placed
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section ref={mosaicRef} className='bg-[#F8F7F2] py-16'>
        <h2 className='font-ubuntu text-center text-[30px] font-bold text-[#0F1A0E]'>
          Real Farms. Real People. Real Placements.
        </h2>
        <p className='mt-2 text-center text-[14px] text-[#6B7280]'>
          Partner farms and placed candidates across Ghana.
        </p>
        <div className='mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 px-6 md:grid-cols-4 lg:px-8'>
          {MOSAIC.map((m) => (
            <div
              key={m.src}
              className={
                'mosaic-cell relative overflow-hidden rounded-2xl ' + m.h
              }
            >
              <Image src={m.src} alt='' fill className='object-cover' sizes='25vw' />
            </div>
          ))}
        </div>
      </section>

      <section ref={sdgRef} className='bg-white py-12'>
        <p className='text-center text-[11px] font-medium uppercase tracking-widest text-[#6B7280]'>
          CONTRIBUTING TO THE
        </p>
        <h2 className='font-ubuntu mt-1 text-center text-[22px] font-semibold text-[#0F1A0E]'>
          UN Sustainable Development Goals
        </h2>
        <div className='mt-6 flex flex-wrap justify-center gap-4 px-6'>
          {SDG_FILES.map((src) => (
            <div key={src} className='sdg-thumb relative h-16 w-16 overflow-hidden rounded-xl'>
              <Image src={src} alt='' fill className='object-cover' sizes='64px' />
            </div>
          ))}
        </div>
      </section>

      <section ref={ctaRef} className='bg-[#2E7D32] py-20 text-center'>
        <div className='cta-inner mx-auto max-w-3xl px-6'>
          <h2 className='font-ubuntu text-[40px] font-extrabold text-white'>
            Ready to Join Ghana&apos;s Agricultural Revolution?
          </h2>
          <p className='mx-auto mt-3 max-w-lg text-[16px] text-white/80'>
            Whether you are launching a career on a farm or building your workforce, we are here to
            help you grow faster with confidence.
          </p>
          <div className='mt-8 inline-flex flex-wrap justify-center gap-4'>
            <Link
              href='/signup/graduate'
              className='rounded-2xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#2E7D32] transition hover:bg-[#F0F7EE]'
            >
              Get Started as a Graduate
            </Link>
            <Link
              href='/signup/farm'
              className='rounded-2xl border-2 border-white px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10'
            >
              Register Your Farm
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
