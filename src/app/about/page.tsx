'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

const TEAM = [
  {
    name: 'Patience Worlali Kpeda',
    role: 'Co-Founder and Agribusiness Lead',
    bio: 'Chief Technical Officer at the Ministry of Food and Agriculture, Ghana. Agribusiness development expert specialising in climate-smart agriculture, post-harvest loss reduction, and empowering women farmers in the Eastern Region.',
    image: '/PATIENCE-KPEDA-back-1008x1024.png',
  },
  {
    name: 'Batista Simons',
    role: 'Co-Founder and Technology Lead',
    bio: 'Creative developer and full-stack engineer building digital infrastructure that connects Ghana\'s agricultural workforce with modern opportunity.',
    image: '/Batista-Simons-creative-developer.webp',
  },
] as const

const CORE_VALUE_ICONS = [
  {
    name: 'Integrity',
    svg: (
      <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V7l7-4z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Professionalism',
    svg: (
      <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Innovation',
    svg: (
      <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Reliability',
    svg: (
      <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Sustainable Impact',
    svg: (
      <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 22c4-4 8-8 8-12a8 8 0 10-16 0c0 4 4 8 8 12z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="10" r="2" fill="currentColor" />
      </svg>
    ),
  },
] as const

const SDG_ITEMS = [
  { n: 1, label: 'No Poverty' },
  { n: 2, label: 'Zero Hunger' },
  { n: 4, label: 'Quality Education' },
  { n: 8, label: 'Decent Work' },
  { n: 10, label: 'Reduced Inequalities' },
] as const

export default function AboutPage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const storyRef = useRef<HTMLDivElement | null>(null)
  const mvvRef = useRef<HTMLElement | null>(null)
  const statsRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = heroRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.about-hero-anim', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = storyRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.about-story-anim', {
        y: 50,
        opacity: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = mvvRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.about-mvv-card', {
        y: 40,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const nums = el.querySelectorAll('[data-count-target]')
    const ctx = gsap.context(() => {
      nums.forEach((node) => {
        const eln = node as HTMLElement
        const target = parseInt(eln.dataset.countTarget ?? '0', 10)
        const fmt = eln.dataset.countFormat ?? 'plain'
        const obj = { v: 0 }
        gsap.fromTo(
          obj,
          { v: 0 },
          {
            v: target,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: eln, start: 'top 88%', once: true },
            onUpdate() {
              const v = Math.round(obj.v)
              if (fmt === 'pct') eln.textContent = `${v}%`
              else if (fmt === 'plus') eln.textContent = `${v}+`
              else eln.textContent = String(v)
            },
          }
        )
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <main className="font-ubuntu">
      <section
        ref={heroRef}
        className="relative flex min-h-[65vh] flex-col justify-end overflow-hidden pb-16"
      >
        <Image
          src="/ghana_5.jpg"
          alt=""
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-forest/72" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="about-hero-anim mb-4 flex items-center gap-2 text-sm text-white/50">
            <Link href="/" className="text-white/50 transition-colors hover:text-white">
              Home
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white/70">About</span>
          </div>
          <h1 className="about-hero-anim text-6xl font-bold leading-tight text-white md:text-7xl">
            About AgroTalent Hub
          </h1>
          <p className="about-hero-anim mt-4 max-w-2xl text-xl leading-relaxed text-white/70">
            We exist to solve a real problem: thousands of trained agricultural graduates looking for work, while farms struggle to find reliable verified staff.
          </p>
          <div className="about-hero-anim mt-8 flex flex-wrap gap-4">
            {[
              { n: '500+', l: 'Graduates Placed' },
              { n: '100+', l: 'Partner Farms' },
              { n: '16', l: 'Regions Covered' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/20 bg-white/12 px-6 py-4 backdrop-blur"
              >
                <p className="text-3xl font-bold text-white">{s.n}</p>
                <p className="mt-1 text-xs text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div ref={storyRef}>
            <span className="about-story-anim inline-flex w-fit rounded-full border border-gold/30 bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              OUR STORY
            </span>
            <h2 className="about-story-anim mt-4 text-4xl font-bold leading-tight text-forest">
              Why AgroTalent Hub Exists
            </h2>
            <div className="about-story-anim mt-4 space-y-4 text-base leading-relaxed text-gray-500">
              <p>
                AgroTalent Hub was built to solve a paradox facing Ghana&apos;s agricultural sector. Thousands of trained graduates from universities and training colleges are searching for work, while employers and farms struggle to find reliable, verified staff.
              </p>
              <p>
                By structuring profiles, verifying credentials, and improving placement readiness, we reduce friction and increase trust on both sides of every hire.
              </p>
              <p>
                Every placement creates a ripple effect: income for a graduate, productivity for a farm, and growth for Ghana&apos;s agricultural economy.
              </p>
            </div>
          </div>
          <div className="about-story-anim relative h-[480px]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/Learners_agric.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="absolute bottom-6 left-6 flex w-52 items-center gap-3 rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-forest">Verified Process</p>
                <p className="mt-0.5 text-xs text-gray-400">Every candidate checked</p>
              </div>
            </div>
            <div className="absolute right-6 top-6 rounded-2xl bg-forest px-5 py-4 text-white shadow-xl">
              <p className="text-3xl font-bold">95%</p>
              <p className="mt-1 text-xs text-white/70">Placement Rate</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={mvvRef} className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-bold text-forest">What Drives Us</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Mission, vision, and values guide every product decision and every placement.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="about-mvv-card rounded-3xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                <svg className="h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold">MISSION</p>
              <h3 className="mt-2 text-xl font-bold text-forest">What We Do</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                To connect skilled agricultural talent with growth-oriented employers and farms using digital verification, structured onboarding, and clear placement workflows.
              </p>
            </div>
            <div className="about-mvv-card rounded-3xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                <svg className="h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold">VISION</p>
              <h3 className="mt-2 text-xl font-bold text-forest">Where We Are Going</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                To be the most trusted agricultural talent platform in West Africa, building a verified ecosystem where talent, opportunity, and readiness meet.
              </p>
            </div>
            <div className="about-mvv-card rounded-3xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                <svg className="h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold">VALUES</p>
              <h3 className="mt-2 text-xl font-bold text-forest">How We Operate</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Integrity in every placement. Professionalism in every interaction. Innovation in how we match talent to opportunity. Reliability you can count on.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section ref={statsRef} className="relative overflow-hidden bg-forest px-6 py-20">
        <div
          className="pointer-events-none absolute right-[-60px] top-[-60px] h-64 w-64 rounded-full bg-brand/30 blur-[80px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-40px] left-[-40px] h-48 w-48 rounded-full bg-gold/15 blur-[60px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold text-white">Our Impact in Numbers</h2>
          <p className="mt-3 text-white/60">Outcomes we track as the network grows.</p>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { target: 500, label: 'Graduates Placed', fmt: 'plain' as const },
              { target: 100, label: 'Partner Farms', fmt: 'plain' as const },
              { target: 95, label: 'Placement Rate', fmt: 'pct' as const },
              { target: 7, label: 'Avg Days to Match', fmt: 'plain' as const },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/8 p-6 text-center"
              >
                <p
                  className="text-5xl font-bold text-white"
                  data-count-target={s.target}
                  data-count-format={s.fmt}
                >
                  {s.fmt === 'pct' ? '0%' : '0'}
                </p>
                <p className="mt-2 text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-forest md:text-4xl">
          The People Behind AgroTalent Hub
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          Building Ghana&apos;s agricultural future through expertise and technology.
        </p>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-cream"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={m.image}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <p className="text-lg font-bold text-forest">{m.name}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gold">{m.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-5">
          {CORE_VALUE_ICONS.map((v) => (
            <div
              key={v.name}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                {v.svg}
              </div>
              <p className="mt-3 text-sm font-bold text-forest">{v.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-forest">
          Contributing to the UN SDGs
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-gray-500">
          Aligning placements and training with global goals for people and prosperity.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {SDG_ITEMS.map((s) => (
            <div key={s.n} className="flex flex-col items-center">
              <Image
                src={`/Sustainable_Development_Goal_${s.n}.webp`}
                alt=""
                width={80}
                height={80}
                className="rounded-xl shadow-sm"
              />
              <p className="mt-2 max-w-[80px] text-center text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white">Join Ghana&apos;s Agricultural Revolution</h2>
          <p className="mt-4 text-lg text-white/80">
            Whether you are a graduate, student, skilled worker, or farm owner, there is a place for you on AgroTalent Hub.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-white px-8 py-4 font-bold text-brand transition-colors hover:bg-white/90"
            >
              Create Your Profile
            </Link>
            <Link
              href="/services"
              className="rounded-full border-2 border-white/30 px-8 py-4 font-medium text-white transition-colors hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
