import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark">
      <section className="border-b border-[#e9f1ed] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#101914] dark:text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-[#578e73] dark:text-[#8ab6a1] text-lg">
            Terms that govern access and use of AgroTalent Hub.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Last updated: January 2026</p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#d3e4db] dark:border-white/10 p-8 md:p-12 shadow-sm">
          <div className="space-y-10">
            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Acceptance</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By using AgroTalent Hub, you agree to these Terms. If you do not agree, do not use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Accounts & eligibility</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>You must provide accurate information and keep it up to date.</li>
                <li>You are responsible for protecting your login credentials.</li>
                <li>You may not use the platform for unlawful or harmful activity.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Roles on the platform</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                The platform supports candidates (e.g., graduates/students) and employers/farms. We may introduce additional
                categories over time.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Verification</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may verify profiles and documents to improve trust and safety. Verification does not guarantee employment,
                performance, or placement success.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Jobs, applications & placements</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Employers/farms are responsible for the accuracy of job postings.</li>
                <li>Candidates are responsible for the accuracy of applications and profiles.</li>
                <li>Final hiring/engagement decisions are made by employers/farms.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Fees</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Some services may involve fees. Where applicable, fees will be presented in the platform before payment.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Acceptable use</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>No impersonation, fraud, or misrepresentation.</li>
                <li>No harassment, abuse, or discriminatory content.</li>
                <li>No attempts to disrupt or misuse the platform.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Limitation of liability</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                AgroTalent Hub provides the platform “as is”. We are not liable for agreements, disputes, or outcomes between
                users. To the extent permitted by law, we disclaim warranties and limit liability.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Changes</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update these Terms from time to time. Continued use of the platform after updates means you accept
                the revised Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Contact</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                For questions about these Terms, contact us via{' '}
                <Link href="/contact" className="text-primary hover:underline">Contact</Link> or email{' '}
                <a className="text-primary hover:underline" href="mailto:agrotalenthub@gmail.com">agrotalenthub@gmail.com</a>.
                Call/WhatsApp: <strong>+233 54 343 5294 / +233 55 301 8172</strong>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/10">
            <Link href="/" className="text-primary hover:underline font-semibold">← Back to Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
