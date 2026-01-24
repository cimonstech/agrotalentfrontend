'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please provide your full name, email address, and message.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit. Please try again.')
      }

      setSuccess(data?.message || 'Thank you for contacting us. We will get back to you soon!')
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex-grow">
      {/* Header */}
      <section
        className="w-full border-b border-[#e9f1ed] dark:border-white/10"
        style={{
          backgroundImage:
            // Local asset requested by user + remote fallback
            `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.65)), url('/vast-farming-land.Bpd1NAnJ.webp'), url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-kElpTUoCgxWUirxX9dMta0fR1bBMMkehfQc_BrZFt4wPMh8Kma0iTMGyq4aQ1if9x3JJ5JJEjrqB4t4QRpIeDkFbYm7LWJo0B3LgQzRZAnAisupt--5TsBhrLhoFuVZgVyhQMahNR15haJER2gkGUqGcmjBqw7WzSvniZK9Tj1Wq3PTuErUo0kC5IdeU6urTyiXx_wM4oyFZMxSXHhe3lDTeFa6_7NpBKpKQ0RmtHlXFzHiOjdPUoWVhf34Rnlnt9-7yPiattGc')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
          <div className="max-w-3xl">
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
              Contact AgroTalent Hub
            </h1>
            <p className="text-white/90 text-lg">
              Support, partnerships, recruitment requests, or general inquiries — we’re here to help.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-[#101914] dark:text-white text-3xl font-bold leading-tight mb-4">Get in Touch</h2>
              <p className="text-[#578e73] dark:text-primary/80 text-lg">
                We respond as quickly as possible (usually within 1–2 business days).
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-white/5 border border-[#d3e4db] dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary">
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                  <p className="text-primary font-bold text-sm uppercase tracking-wider">Email Us</p>
                  <p className="text-[#101914] dark:text-white text-lg font-medium">support@agrotalenthub.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-white/5 border border-[#d3e4db] dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary">
                  <i className="fas fa-phone"></i>
                </div>
                <div>
                  <p className="text-primary font-bold text-sm uppercase tracking-wider">Call / WhatsApp</p>
                  <p className="text-[#101914] dark:text-white text-lg font-medium">
                    +233 54 343 5294 / +233 55 301 8172
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 p-8 rounded-xl border border-[#d3e4db] dark:border-white/10 shadow-lg">
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-[#101914] dark:text-white text-sm font-semibold">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#d3e4db] dark:border-white/20 bg-transparent h-12 p-4 text-base"
                  placeholder="Kofi Mensah"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#101914] dark:text-white text-sm font-semibold">Email Address</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#d3e4db] dark:border-white/20 bg-transparent h-12 p-4 text-base"
                  placeholder="kofi@example.com"
                  type="email"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[#101914] dark:text-white text-sm font-semibold">Phone (optional)</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#d3e4db] dark:border-white/20 bg-transparent h-12 p-4 text-base"
                    placeholder="+233 XX XXX XXXX"
                    type="tel"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[#101914] dark:text-white text-sm font-semibold">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#d3e4db] dark:border-white/20 bg-transparent h-12 px-4 text-base"
                  >
                    <option>General Inquiry</option>
                    <option>Support</option>
                    <option>Partnership</option>
                    <option>Recruitment Request</option>
                    <option>Training</option>
                    <option>Payments</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#101914] dark:text-white text-sm font-semibold">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#d3e4db] dark:border-white/20 bg-transparent p-4 text-base"
                  placeholder="How can we help?"
                  rows={5}
                />
              </div>
              <button
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center rounded-lg h-14 bg-primary text-white text-lg font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
