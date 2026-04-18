'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { Check, Minus, Plus, Briefcase, MonitorPlay, GraduationCap, ClipboardList } from 'lucide-react'

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
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

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
        <Check className="h-3 w-3 text-brand" strokeWidth={2.5} aria-hidden />
      </div>
      <span className="text-sm text-gray-600">{text}</span>
    </li>
  )
}

const STRIP_IMAGES = [
  { src: '/plantainfarm.jpg', alt: 'Plantain farm' },
  { src: '/greenhouse2.jpg', alt: 'Greenhouse' },
  { src: '/vast-farming-land.Bpd1NAnJ.webp', alt: 'Farming landscape' },
  { src: '/Womanmobile.webp', alt: 'Agricultural worker' },
  { src: '/ghana_5.jpg', alt: 'Ghana agriculture' },
  { src: '/pict_large.jpg', alt: 'Field work' },
] as const

type ServiceModule = {
  id: string
  title: string
  category: string
  categoryStyle: 'brand' | 'gold' | 'forest'
  icon: typeof Briefcase
  thumb: string
  image: string
  imageBadge: string | null
  body: string
  features: string[]
  pricingNote: string | null
  cta: { href: string; label: string }
}

const MODULES: ServiceModule[] = [
  {
    id: 'recruitment',
    title: 'Recruitment and Placement',
    category: 'Recruitment',
    categoryStyle: 'brand',
    icon: Briefcase,
    thumb: '/Women_interns.webp',
    image: '/Women_interns.webp',
    imageBadge: 'GHS 200 placement fee',
    body: 'We match verified candidates to active farm roles using structured profiles, document checks, and clear placement records.',
    features: [
      'Role-based job postings and applications',
      'Employer dashboards for shortlisting',
      'Placement tracking from offer to start date',
      'Automated notifications at every stage',
    ],
    pricingNote: 'GHS 200 placement fee per confirmed hire',
    cta: { href: '/signup', label: 'Get Started' },
  },
  {
    id: 'training',
    title: 'Training and Onboarding',
    category: 'Training',
    categoryStyle: 'forest',
    icon: MonitorPlay,
    thumb: '/Agribusiness.jpg',
    image: '/Agribusiness.jpg',
    imageBadge: 'Zoom sessions included',
    body: 'Orientation sessions and attendance tracking help new hires show up ready for the field.',
    features: [
      'Scheduled Zoom training sessions per cohort',
      'Attendance visibility for employers',
      'Resources aligned to safety and farm operations',
      'Pre-deployment readiness confirmation',
    ],
    pricingNote: null,
    cta: { href: '/signup', label: 'Get Started' },
  },
  {
    id: 'internship',
    title: 'Internship and NSS Placement',
    category: 'Students',
    categoryStyle: 'gold',
    icon: GraduationCap,
    thumb: '/image_interns.jpg',
    image: '/image_interns.jpg',
    imageBadge: 'NSS and internship ready',
    body: 'Structured pathways for students and national service personnel to gain real farm experience.',
    features: [
      'NSS and internship postings',
      'Supervisor-friendly check-ins',
      'Feedback loops for institutions',
      'Region-matched placements',
    ],
    pricingNote: null,
    cta: { href: '/signup', label: 'Get Started' },
  },
  {
    id: 'data',
    title: 'Data Collection and Field Research',
    category: 'Field research',
    categoryStyle: 'brand',
    icon: ClipboardList,
    thumb: '/large_photo_data_collection.jpg',
    image: '/large_photo_data_collection.jpg',
    imageBadge: 'Field-ready personnel',
    body: 'Lightweight data collection support for farms that need consistent field reporting.',
    features: [
      'Templates aligned to crop and livestock workflows',
      'Export-friendly summaries',
      'Privacy-conscious handling',
      'Regional enumerators available',
    ],
    pricingNote: null,
    cta: { href: '/contact', label: 'Contact Us' },
  },
]

function categoryPillClasses(style: ServiceModule['categoryStyle']) {
  if (style === 'gold') {
    return 'bg-gold/15 text-bark border border-gold/25'
  }
  if (style === 'forest') {
    return 'bg-forest/10 text-forest border border-forest/15'
  }
  return 'bg-brand/10 text-brand border border-brand/20'
}

export default function ServicesPage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const baseId = useId()
  const [openId, setOpenId] = useState<string | null>(MODULES[0]?.id ?? null)

  useEffect(() => {
    const root = heroRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.hero-services-anim', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id))
  }

  return (
    <main className="font-ubuntu">
      <section
        ref={heroRef}
        className="relative h-[60vh] min-h-[400px] w-full overflow-hidden"
      >
        <Image
          src="/Agriculture-Culture-in-Africa-Images.webp"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-forest/70" aria-hidden />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-12">
          <div className="mx-auto w-full max-w-7xl">
            <span className="hero-services-anim mb-4 inline-flex w-fit rounded-full border border-gold/40 bg-gold/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-gold">
              WHAT WE OFFER
            </span>
            <h1 className="hero-services-anim text-5xl font-bold leading-tight text-white md:text-6xl">
              Our Services
            </h1>
            <p className="hero-services-anim mt-3 max-w-2xl text-lg text-white/70">
              Everything you need to connect verified agricultural talent with modern
              farms across Ghana. Open a module below for details.
            </p>
            <div className="mt-6 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-white">4</p>
                <p className="text-xs text-white/60">Modules</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">GHS 200</p>
                <p className="text-xs text-white/60">Placement Fee</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">16</p>
                <p className="text-xs text-white/60">Regions Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Service modules
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold text-forest md:text-4xl">
            How we support farms and talent
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-500 md:text-base">
            Tap a row to expand. Each module includes deliverables and a clear next
            step.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.04]">
            {MODULES.map((m) => {
              const open = openId === m.id
              const panelId = `${baseId}-${m.id}-panel`
              const Icon = m.icon
              return (
                <div
                  key={m.id}
                  className="border-b border-gray-200 last:border-b-0 bg-white"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    id={`${baseId}-${m.id}-header`}
                    onClick={() => toggle(m.id)}
                    className="flex w-full items-center gap-3 px-4 py-5 text-left transition-colors hover:bg-gray-50/90 md:gap-5 md:px-6 md:py-6"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand md:h-12 md:w-12">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 text-lg font-semibold leading-snug text-forest md:text-xl">
                      {m.title}
                    </span>
                    <span className="hidden shrink-0 items-center gap-3 sm:flex">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryPillClasses(m.categoryStyle)}`}
                      >
                        {m.category}
                      </span>
                      <span className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                        <Image
                          src={m.thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </span>
                    </span>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-forest"
                      aria-hidden
                    >
                      {open ? (
                        <Minus className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Plus className="h-4 w-4" strokeWidth={2} />
                      )}
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`${baseId}-${m.id}-header`}
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                      open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="border-t border-gray-200 bg-white px-4 pb-8 pt-4 md:px-6 md:pt-6">
                        <div className="mb-4 flex flex-wrap items-center gap-2 sm:hidden">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryPillClasses(m.categoryStyle)}`}
                          >
                            {m.category}
                          </span>
                          <span className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200">
                            <Image
                              src={m.thumb}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </span>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                          <div>
                            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
                              {m.body}
                            </p>
                            <ul className="mt-5 space-y-3">
                              {m.features.map((f) => (
                                <FeatureItem key={f} text={f} />
                              ))}
                            </ul>
                            {m.pricingNote ? (
                              <div className="mt-6 rounded-xl border border-gold/20 bg-gold/8 px-4 py-3">
                                <p className="text-sm font-semibold text-bark">
                                  {m.pricingNote}
                                </p>
                              </div>
                            ) : null}
                            <Link
                              href={m.cta.href}
                              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest md:text-base"
                            >
                              {m.cta.label}
                              <ArrowRightIcon />
                            </Link>
                          </div>
                          <div className="relative min-h-[220px] overflow-hidden rounded-2xl shadow-lg md:min-h-[320px]">
                            <Image
                              src={m.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 400px"
                            />
                            {m.imageBadge ? (
                              <div className="absolute bottom-4 left-4 max-w-[90%] rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-forest shadow-md backdrop-blur">
                                {m.imageBadge}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-forest px-6 py-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 0, transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-brand/30 blur-[80px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-56 w-56 rounded-full bg-gold/15 blur-[60px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-white/70">
            Whether you are launching a career or scaling a farm team, we are here
            to help you move faster with confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup/graduate"
              className="rounded-full bg-gold px-8 py-4 font-bold text-forest hover:bg-gold/90"
            >
              For Graduates
            </Link>
            <Link
              href="/signup/farm"
              className="rounded-full border-2 border-white/30 px-8 py-4 font-medium text-white hover:bg-white/10"
            >
              For Farms
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white px-6 py-8">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-gray-300">
          {'TRUSTED ACROSS GHANA\'S FARMS'}
        </p>
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
          {STRIP_IMAGES.map((img) => (
            <div
              key={img.src}
              className="relative h-32 w-52 shrink-0 overflow-hidden rounded-2xl"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="208px"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
