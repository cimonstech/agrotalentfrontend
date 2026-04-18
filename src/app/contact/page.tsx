'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Clock, Loader2, Mail, MapPin, Minus, Phone, Plus, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'

const supabase = createSupabaseClient()

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type FormData = z.infer<typeof schema>

const FAQS = [
  {
    q: 'How does the verification process work?',
    a: 'We review uploaded certificates, transcripts, and identity documents. Verified accounts are marked with a badge visible to all employers.',
  },
  {
    q: 'How much does it cost to post a job?',
    a: 'Job posting is free. We charge a GHS 200 placement fee only when a hire is confirmed and the worker starts.',
  },
  {
    q: 'How long does matching take?',
    a: 'Most candidates receive their first match within 7 days of completing their profile and verification.',
  },
  {
    q: 'Can I use AgroTalent Hub from outside Accra?',
    a: 'Yes. Our platform covers all 16 regions of Ghana. Our location-first algorithm prioritizes regional matches.',
  },
] as const

export default function ContactPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const leftRef = useRef<HTMLDivElement | null>(null)
  const rightRef = useRef<HTMLDivElement | null>(null)
  const faqRef = useRef<HTMLElement | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  })

  async function onSubmit(data: FormData) {
    setSuccess(false)
    setServerError('')
    const { error } = await supabase.from('contact_submissions').insert({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
      status: 'new',
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
    reset()
  }

  useEffect(() => {
    const el = leftRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.contact-left-anim', {
        x: -40,
        opacity: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = rightRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.contact-right-anim', {
        x: 40,
        opacity: 0,
        duration: 0.75,
        delay: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const el = faqRef.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.from('.contact-faq-item', {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <main className="font-ubuntu">
      <section className="relative overflow-hidden bg-forest px-6 py-32">
        <div
          className="pointer-events-none absolute right-[-60px] top-[-60px] h-64 w-64 rounded-full bg-brand/30 blur-[80px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-40px] left-[-40px] h-48 w-48 rounded-full bg-gold/15 blur-[60px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <span className="inline-flex rounded-full border border-gold/35 bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
            GET IN TOUCH
          </span>
          <h1 className="mt-4 text-6xl font-bold text-white">Contact Us</h1>
          <p className="mt-4 max-w-lg text-xl text-white/70">
            We are here to help. Whether you are a farm, a graduate, or a student, reach out and we will respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-5">
          <div ref={leftRef} className="lg:col-span-2">
            <div className="contact-left-anim">
              <h2 className="text-2xl font-bold text-forest">Get in Touch</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Prefer email or WhatsApp? We monitor every channel during business hours.
              </p>
              <ul className="mt-8 space-y-6">
                {[
                  { Icon: Mail, label: 'Email', value: 'support@agrotalenthub.com' },
                  { Icon: Phone, label: 'Phone', value: '+233 54 343 5294' },
                  { Icon: Phone, label: 'Whatsapp', value: '+233 55 301 8172' },
                  { Icon: MapPin, label: 'Location', value: 'Accra, Ghana' },
                  { Icon: Clock, label: 'Office Hours', value: 'Monday to Friday, 8am to 5pm GMT' },
                ].map((row) => (
                  <li key={row.label} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/8">
                      <row.Icon className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{row.label}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-800">{row.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-brand hover:bg-brand/5"
                  aria-label="LinkedIn"
                >
                  <svg className="h-4 w-4 text-forest" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-brand hover:bg-brand/5"
                  aria-label="Twitter"
                >
                  <svg className="h-4 w-4 text-forest" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-brand hover:bg-brand/5"
                  aria-label="Facebook"
                >
                  <svg className="h-4 w-4 text-forest" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
              <div className="relative mt-8 h-48 w-full overflow-hidden rounded-2xl">
                <Image
                  src="/ghana_5.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>

          <div ref={rightRef} className="lg:col-span-3">
            <div className="contact-right-anim rounded-3xl border border-gray-100 bg-cream p-8">
              <h3 className="text-xl font-bold text-forest">Send us a Message</h3>
              <p className="mt-1 text-sm text-gray-500">We typically reply within one business day.</p>

              {success ? (
                <div className="mt-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                    <svg className="h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-forest">Message Sent!</h3>
                  <p className="mt-2 text-gray-500">We will get back to you within 24 hours.</p>
                  <Link href="/" className="mt-4 inline-block font-semibold text-brand">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  {serverError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {serverError}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="contact-name">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                        placeholder="Your name"
                        {...register('name')}
                      />
                      {errors.name ? <p className="text-xs text-red-500">{errors.name.message}</p> : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="contact-email">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                        placeholder="you@example.com"
                        {...register('email')}
                      />
                      {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="contact-phone">
                        Phone
                      </label>
                      <input
                        id="contact-phone"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                        placeholder="Optional"
                        {...register('phone')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="contact-subject">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                        placeholder="Optional"
                        {...register('subject')}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="contact-message">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                      placeholder="How can we help?"
                      {...register('message')}
                    />
                    {errors.message ? <p className="text-xs text-red-500">{errors.message.message}</p> : null}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 font-bold text-white transition-colors hover:bg-forest disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Send className="h-5 w-5" aria-hidden />
                    )}
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section ref={faqRef} className="bg-cream px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-forest">Common Questions</h2>
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          {FAQS.map((item, i) => {
            const open = openFaq === i
            return (
              <div
                key={item.q}
                className="contact-faq-item overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-forest">{item.q}</span>
                  <span className="ml-3 text-brand" aria-hidden>
                    {open ? <Minus className="h-5 w-5" strokeWidth={2} /> : <Plus className="h-5 w-5" strokeWidth={2} />}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-gray-50 px-5 pb-5 pt-4 text-sm leading-relaxed text-gray-500">
                    {item.a}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
