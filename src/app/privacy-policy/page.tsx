import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark">
      <section className="border-b border-[#e9f1ed] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#101914] dark:text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-[#578e73] dark:text-[#8ab6a1] text-lg">
            How AgroTalent Hub collects, uses, and protects your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Last updated: January 2026</p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-14">
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#d3e4db] dark:border-white/10 p-8 md:p-12 shadow-sm">
          <div className="space-y-10">
            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Introduction</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                AgroTalent Hub (“we”, “our”, “us”) operates a platform that connects agricultural candidates with verified
                opportunities and supports employers/farms with recruitment and onboarding.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Information we collect</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Account details</strong>: name, email address, phone number, role.</li>
                <li><strong>Profile details</strong>: education, qualifications, specialization, preferred region, work experience.</li>
                <li><strong>Employer/farm details</strong>: employer/farm name, type, location/region and other operational details you provide.</li>
                <li><strong>Usage data</strong>: device and log information, pages visited, actions taken (for reliability and security).</li>
                <li><strong>Messages & communications</strong>: messages you send via the platform and support communications.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">How we use your information</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>To provide the platform (accounts, dashboards, job listings, applications).</li>
                <li>To verify profiles and documents where applicable.</li>
                <li>To run matching and enforce regional placement rules where configured.</li>
                <li>To send service communications (verification, notifications, training assignments).</li>
                <li>To improve performance, security, and user experience.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Sharing of information</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We share information only as needed to operate the service (e.g., candidates applying to an employer/farm),
                comply with legal obligations, or with service providers that help us run the platform (e.g., email delivery).
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Security</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use technical and organizational measures intended to protect your data. No system is 100% secure; please
                keep your credentials safe and contact us if you suspect unauthorized access.
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Your choices</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Access and update your profile details from your dashboard.</li>
                <li>Request account deletion by contacting support.</li>
                <li>Manage certain notifications within the platform (where available).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-xl font-bold text-[#101914] dark:text-white">Contact</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you have questions about this policy, contact us via{' '}
                <Link href="/contact" className="text-primary hover:underline">Contact</Link> or email{' '}
                <a className="text-primary hover:underline" href="mailto:agrotalenthub@gmail.com">agrotalenthub@gmail.com</a>.
                You can also call/WhatsApp: <strong>+233 54 343 5294 / +233 55 301 8172</strong>.
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
