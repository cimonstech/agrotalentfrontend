import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-16 font-ubuntu">
      <Image
        src="/vast-farming-land.Bpd1NAnJ.webp"
        alt=""
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-cream/92" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />

      <section className="relative z-10 w-full max-w-2xl rounded-3xl border border-gray-200/80 bg-white p-8 text-center shadow-[0_6px_28px_rgba(13,51,32,0.08)] md:p-12">
        <p className="inline-flex rounded-full border border-gold/35 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bark">
          Page not found
        </p>
        <h1 className="mt-4 text-5xl font-bold leading-none text-forest md:text-7xl">
          404
        </h1>
        <h2 className="mt-4 text-2xl font-bold text-forest md:text-3xl">
          We couldn&apos;t find that page
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500 md:text-base">
          The link may be broken, expired, or the page may have moved. Use one
          of the options below to continue.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-forest"
          >
            Go to Homepage
          </Link>
          <Link
            href="/jobs"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Browse Jobs
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  )
}

