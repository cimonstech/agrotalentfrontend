'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { GHANA_REGIONS } from '@/lib/utils'

const supabase = createSupabaseClient()

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
] as const

const SDG_DETAIL = [
  {
    n: 1,
    title: 'No Poverty',
    body: 'By placing agricultural workers in paid employment, we directly contribute to reducing poverty in rural and peri-urban Ghana.',
  },
  {
    n: 2,
    title: 'Zero Hunger',
    body: 'Connecting trained agricultural talent with farms increases food production capacity across all 16 regions.',
  },
  {
    n: 4,
    title: 'Quality Education',
    body: 'Our NSS and internship pathways bridge academic training and real-world farm experience for students.',
  },
  {
    n: 8,
    title: 'Decent Work',
    body: 'We create structured, verified employment pathways that provide fair pay and professional working conditions.',
  },
  {
    n: 10,
    title: 'Reduced Inequalities',
    body: 'Location-first matching ensures rural graduates have equal access to opportunities regardless of geography.',
  },
] as const

const SHOWCASE = [
  { src: '/greenhouse-lady.jpg', h: 'h-64' },
  { src: '/image_interns.webp', h: 'h-48' },
  { src: '/Agribusiness.jpg', h: 'h-72' },
  { src: '/Women_interns.webp', h: 'h-56' },
  { src: '/plantainfarm.jpg', h: 'h-48' },
  { src: '/sacking.jpg', h: 'h-64' },
  { src: '/greenhouseman.jpg', h: 'h-52' },
  { src: '/Womanmobile.webp', h: 'h-44' },
] as const

type LiveStats = {
  workers: number
  farms: number
  placements: number
  jobs: number
  training: number
}

export default function ImpactPage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const liveStatsRef = useRef<HTMLElement | null>(null)
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [statsReady, setStatsReady] = useState(false)

  useEffect(() => {
    const root = heroRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.impact-hero-anim', {
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
    let cancelled = false
    ;(async () => {
      const results = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'farm'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['graduate', 'student', 'skilled']),
        supabase
          .from('placements')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('training_sessions').select('*', { count: 'exact', head: true }),
      ])
      const [, farmProfiles, workerProfiles, completedPlacements, jobsCount, trainingCount] = results
      if (cancelled) return
      setStats({
        workers: workerProfiles.count ?? 0,
        farms: farmProfiles.count ?? 0,
        placements: completedPlacements.count ?? 0,
        jobs: jobsCount.count ?? 0,
        training: trainingCount.count ?? 0,
      })
      setStatsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!statsReady || !stats) return
    const el = liveStatsRef.current
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
              if (fmt === 'plain') eln.textContent = String(v)
            },
          }
        )
      })
    }, el)
    return () => ctx.revert()
  }, [stats, statsReady])

  const w = stats?.workers ?? 0
  const f = stats?.farms ?? 0
  const p = stats?.placements ?? 0
  const j = stats?.jobs ?? 0
  const t = stats?.training ?? 0

  return (
    <main className="font-ubuntu">
      <section
        ref={heroRef}
        className="relative flex min-h-[60vh] flex-col justify-end overflow-hidden pb-16"
      >
        <Image
          src="/plantainfarm.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-forest/75" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <span className="impact-hero-anim inline-flex rounded-full border border-gold/35 bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
            OUR IMPACT
          </span>
          <h1 className="impact-hero-anim mt-4 text-6xl font-bold text-white">
            Transforming Lives and Communities
          </h1>
          <p className="impact-hero-anim mt-4 max-w-2xl text-xl text-white/70">
            Every placement creates a ripple effect of positive change across Ghana&apos;s agricultural sector.
          </p>
        </div>
      </section>

      <section ref={liveStatsRef} className="bg-cream px-6 py-20">
        <h2 className="text-center text-4xl font-bold text-forest">Impact by the Numbers</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-gray-500">
          Real data from our platform, updated live.
        </p>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={w}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Verified Workers</p>
            <p className="mt-1 text-xs font-semibold text-brand">On the platform</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={f}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Partner Farms</p>
            <p className="mt-1 text-xs font-semibold text-brand">Across all regions</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={p}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Placements Completed</p>
            <p className="mt-1 text-xs font-semibold text-brand">And counting</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={j}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Jobs Posted</p>
            <p className="mt-1 text-xs font-semibold text-brand">Total opportunities</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={t}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Training Sessions</p>
            <p className="mt-1 text-xs font-semibold text-brand">Delivered</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p
              className="text-5xl font-bold text-forest"
              data-count-target={16}
              data-count-format="plain"
            >
              0
            </p>
            <p className="mt-2 text-sm text-gray-400">Regions Covered</p>
            <p className="mt-1 text-xs font-semibold text-brand">Across Ghana</p>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <h2 className="text-center text-4xl font-bold text-forest">UN Sustainable Development Goals</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          How AgroTalent Hub advances the SDGs through verified hiring and training.
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SDG_DETAIL.map((s) => (
            <div
              key={s.n}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-cream transition-shadow hover:shadow-lg"
            >
              <div className="h-2 bg-brand" aria-hidden />
              <div className="p-6">
                <div className="flex items-center">
                  <Image
                    src={`/Sustainable_Development_Goal_${s.n}.webp`}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  <h3 className="ml-3 text-lg font-bold text-forest">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-forest">Active Across All 16 Regions</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
          Our location-first matching algorithm prioritizes candidates already in the same region as the farm.
        </p>
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {GHANA_REGIONS.map((region) => (
              <div
                key={region}
                className="flex cursor-default items-center justify-center gap-2 rounded-full border border-brand/15 bg-brand/8 px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/15"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {region}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-forest">Ghana&apos;s Agricultural Workforce</h2>
        <div className="mx-auto mt-10 max-w-5xl columns-1 gap-4 md:columns-2 lg:columns-3">
          {SHOWCASE.map((item) => (
            <div
              key={item.src}
              className={`relative mb-4 break-inside-avoid overflow-hidden rounded-2xl ${item.h}`}
            >
              <Image
                src={item.src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold text-white">What Our Partners Say</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/10 bg-white/8 p-8"
            >
              <p className="text-6xl font-bold leading-none text-gold">&quot;</p>
              <p className="mt-2 text-sm italic leading-relaxed text-white/80">{t.quote}</p>
              <div className="mt-6 flex items-center">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={t.avatar}
                    alt=""
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

      <section className="bg-brand px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white">Be Part of the Change</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup/graduate"
              className="rounded-full bg-white px-8 py-4 font-bold text-brand transition-colors hover:bg-white/90"
            >
              Join as a Graduate
            </Link>
            <Link
              href="/signup/farm"
              className="rounded-full border-2 border-white/30 px-8 py-4 font-medium text-white transition-colors hover:bg-white/10"
            >
              Register Your Farm
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
