import Link from 'next/link'
import { Shield } from 'lucide-react'

function DotList({ items }: { items: string[] }) {
  return (
    <ul className='space-y-2'>
      {items.map((item) => (
        <li key={item} className='flex items-start gap-2'>
          <span className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand' aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className='min-h-screen bg-background-light dark:bg-background-dark'>
      <section className='bg-forest'>
        <div className='mx-auto max-w-[1200px] px-4 py-14 lg:px-10'>
          <h1 className='text-5xl font-bold text-white'>Privacy Policy</h1>
          <p className='mt-3 text-white/70'>
            How AgroTalent Hub collects, uses, and protects your information.
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-3xl px-6 py-16'>
        <div className='mb-8 inline-flex rounded-full border border-gold/30 bg-gold/15 px-4 py-1.5 text-xs font-semibold text-gold'>
          Last updated: April 2026
        </div>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>INTRODUCTION</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            AgroTalent Hub ('we', 'our', 'us') operates a platform that connects agricultural candidates with verified opportunities and supports employers and farms with recruitment and onboarding. This policy explains how we collect, use, and protect your information when you use our platform.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>INFORMATION WE COLLECT</h2>
          <div className='text-base leading-relaxed text-gray-600'>
            <DotList
              items={[
                'Account details: name, email address, phone number, and role (farm, graduate, student, or skilled worker).',
                'Profile details: education, qualifications, specialization, preferred region, and work experience.',
                'Employer and farm details: farm name, type, location, region, and other operational details you provide.',
                'Documents: certificates, transcripts, CVs, and NSS letters uploaded for verification purposes.',
                'Usage data: device and log information, pages visited, and actions taken for reliability and security.',
                'Messages and communications: messages sent via the platform and support communications.',
                'Google account data: if you sign in with Google, we receive your name and email address only. We do not access any other Google account data including contacts, calendar, drive, or any other Google services.',
              ]}
            />
          </div>
        </section>

        <section className='mb-10'>
          <div className='rounded-2xl border border-blue-100 bg-blue-50 p-6'>
            <div className='flex items-start gap-3'>
              <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' aria-hidden />
              <div>
                <h2 className='mb-3 text-xl font-bold text-forest'>SIGN IN WITH GOOGLE</h2>
                <p className='text-base leading-relaxed text-gray-600'>
                  AgroTalent Hub offers Google OAuth as a sign-in option for your convenience. When you choose to sign in or sign up with Google, Google shares only your name and email address with us. We use this information solely to create and manage your AgroTalent Hub account. We do not request or store any other data from your Google account. You can revoke AgroTalent Hub access to your Google account at any time by visiting your Google Account permissions page at myaccount.google.com/permissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>HOW WE USE YOUR INFORMATION</h2>
          <div className='text-base leading-relaxed text-gray-600'>
            <DotList
              items={[
                'To provide the platform including accounts, dashboards, job listings, and applications.',
                'To verify profiles and documents where applicable.',
                'To run matching and enforce regional placement rules.',
                'To send service communications including verification emails, notifications, and training assignments.',
                'To improve performance, security, and user experience.',
                'To process placement fees and payment records where applicable.',
              ]}
            />
          </div>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>SHARING OF INFORMATION</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            We share information only as needed to operate the service (for example, candidates applying to an employer or farm see relevant job details and employers see applicant profiles). We may also share information to comply with legal obligations or with service providers that help us run the platform such as email delivery services, file storage, and payment processors. We do not sell your personal data to third parties.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>DATA RETENTION</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            We retain your account and profile data for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days except where retention is required by law or for legitimate business purposes such as payment records.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>SECURITY</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            We use technical and organizational measures intended to protect your data including encrypted connections (HTTPS), access controls, and secure file storage. No system is 100% secure. Please keep your credentials safe and contact us immediately if you suspect unauthorized access to your account.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>YOUR RIGHTS AND CHOICES</h2>
          <div className='text-base leading-relaxed text-gray-600'>
            <DotList
              items={[
                'Access and update your profile details from your dashboard at any time.',
                'Request account deletion by contacting our support team.',
                'Manage notification preferences within the platform where available.',
                'Revoke Google OAuth access via your Google Account settings at myaccount.google.com/permissions.',
                'Request a copy of your personal data by contacting us.',
              ]}
            />
          </div>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>COOKIES AND TRACKING</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            AgroTalent Hub uses essential cookies to maintain your session and keep you signed in. We do not use advertising or tracking cookies. We may use analytics to understand how the platform is used in aggregate, without identifying individual users.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>CHANGES TO THIS POLICY</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            We may update this privacy policy from time to time. We will notify registered users of significant changes via email or an in-platform notice. Continued use of the platform after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className='mb-10'>
          <h2 className='mb-3 text-xl font-bold text-forest'>CONTACT</h2>
          <p className='text-base leading-relaxed text-gray-600'>
            If you have questions about this privacy policy or how we handle your data, please contact us:
          </p>
          <div className='mt-4 text-base leading-relaxed text-gray-600'>
            <DotList
              items={[
                'Email: agrotalenthub@gmail.com',
                'Phone and WhatsApp: +233 54 343 5294 / +233 55 301 8172',
                'Contact form: agrotalenthub.com/contact',
                'Address: Accra, Ghana',
              ]}
            />
          </div>
        </section>

        <div className='mt-10 border-t border-gray-200 pt-8'>
          <Link href='/' className='font-semibold text-brand hover:underline'>
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
