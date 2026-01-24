import Link from 'next/link'

const SUPPORT_PHONES = '+233 54 343 5294 / +233 55 301 8172'

export default function HelpCenterPage() {
  const faqs: { question: string; answer: JSX.Element }[] = [
    {
      question: 'How do I create an account?',
      answer: (
        <>
          Go to <Link className="text-primary hover:underline" href="/signup">Sign up</Link>, choose your role, and complete your profile. You’ll receive an email verification link before you can sign in.
        </>
      )
    },
    {
      question: 'Why do I need verification (and how long does it take)?',
      answer: (
        <>
          Verification builds trust for placements. Our team reviews submitted details/documents and marks your profile as verified. Timelines depend on volume, but we aim to respond quickly. If it’s urgent, contact us via WhatsApp: <strong>{SUPPORT_PHONES}</strong>.
        </>
      )
    },
    {
      question: 'I forgot my password. What should I do?',
      answer: (
        <>
          Use <Link className="text-primary hover:underline" href="/forgot-password">Forgot Password</Link> to request a reset email. Open the latest email link and set a new password on the reset page.
        </>
      )
    },
    {
      question: 'How do Employers/Farms request talent?',
      answer: (
        <>
          Employers/Farms can post jobs from their dashboard after signing in. Jobs appear publicly and in candidates’ dashboards based on matching and regional rules.
        </>
      )
    },
    {
      question: 'How do candidates apply to jobs?',
      answer: (
        <>
          Sign in, open <strong>Browse Jobs</strong> inside your dashboard, view a job, and apply. Your application status updates inside your dashboard.
        </>
      )
    },
    {
      question: 'How does regional placement work?',
      answer: (
        <>
          Matching prioritizes roles within the candidate’s preferred region to improve retention and deployment success. Some views may allow broader browsing, but the default is regional-first.
        </>
      )
    },
    {
      question: 'Do you provide training / onboarding?',
      answer: (
        <>
          Yes. Training sessions are managed in the platform and can be assigned by role or region. Attendance is tracked for compliance and proof of readiness.
        </>
      )
    },
    {
      question: 'How do I contact support?',
      answer: (
        <>
          Use the <Link className="text-primary hover:underline" href="/contact">Contact page</Link> or call/WhatsApp: <strong>{SUPPORT_PHONES}</strong>.
        </>
      )
    }
  ]

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark">
      <section className="border-b border-[#e9f1ed] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#101914] dark:text-white mb-4">
              Help Center
            </h1>
            <p className="text-[#578e73] dark:text-[#8ab6a1] text-lg">
              Answers to common questions about accounts, verification, jobs, and training.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-white/5 rounded-xl border border-[#d3e4db] dark:border-white/10 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#101914] dark:text-white mb-3">Quick Links</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link className="hover:text-primary transition-colors" href="/signup">Create an account</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/signin">Sign in</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/forgot-password">Reset password</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/contact">Contact support</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/terms-of-service">Terms of Service</Link></li>
              </ul>
              <div className="mt-6 rounded-lg bg-primary/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Call / WhatsApp</p>
                <p className="text-sm font-semibold text-[#101914] dark:text-white">{SUPPORT_PHONES}</p>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white dark:bg-white/5 rounded-xl border border-[#d3e4db] dark:border-white/10 p-5"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                  <span className="text-[#101914] dark:text-white font-bold">{faq.question}</span>
                  <span className="text-primary transition-transform group-open:rotate-180">
                    <i className="fas fa-chevron-down"></i>
                  </span>
                </summary>
                <div className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

