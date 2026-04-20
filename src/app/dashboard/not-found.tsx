import Link from 'next/link'
import Image from 'next/image'

export default function DashboardNotFound() {
  return (
    <main className="font-ubuntu relative min-h-screen overflow-hidden">
      <Image
        src="/vast-farming-land.Bpd1NAnJ.webp"
        alt=""
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gray-50/92" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-gold via-brand to-forest" />

          <div className="px-8 py-12 text-center md:px-12">
            <span className="inline-flex rounded-full border border-gold/35 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bark">
              Dashboard Page Missing
            </span>

            <h1 className="mt-5 text-5xl font-bold leading-none text-forest md:text-6xl">
              404
            </h1>
            <h2 className="mt-3 text-2xl font-bold text-forest md:text-3xl">
              This dashboard page does not exist
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
              The URL might be outdated, or the resource may have been removed.
              Return to your dashboard home or open a valid section from the
              sidebar.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-forest"
              >
                Go to Dashboard Home
              </Link>
              <Link
                href="/dashboard/admin"
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Open Admin
              </Link>
              <Link
                href="/dashboard/farm"
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Open Farm
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

