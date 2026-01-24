'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ForFarmsPage() {
  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full max-w-[1200px] px-4 md:px-10 py-5">
        <div className="mb-12">
          <div
            className="flex min-h-[520px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-start justify-center px-6 md:px-16"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB-kElpTUoCgxWUirxX9dMta0fR1bBMMkehfQc_BrZFt4wPMh8Kma0iTMGyq4aQ1if9x3JJ5JJEjrqB4t4QRpIeDkFbYm7LWJo0B3LgQzRZAnAisupt--5TsBhrLhoFuVZgVyhQMahNR15haJER2gkGUqGcmjBqw7WzSvniZK9Tj1Wq3PTuErUo0kC5IdeU6urTyiXx_wM4oyFZMxSXHhe3lDTeFa6_7NpBKpKQ0RmtHlXFzHiOjdPUoWVhf34Rnlnt9-7yPiattGc")`,
              backgroundSize: 'cover'
            }}
          >
            <div className="flex flex-col gap-4 text-left max-w-[700px]">
              <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl">
                Verified Agricultural Talent, Region-Based Deployment
              </h1>
              <h2 className="text-white/90 text-lg font-normal leading-normal md:text-xl">
                Connect with verified graduates from accredited Training Colleges and Universities. Location-based matching ensures commitment and retention.
              </h2>
            </div>
            <Link href="/signup" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-lg h-14 px-6 bg-primary text-white text-lg font-bold shadow-lg hover:scale-105 transition-transform">
              Post a Job Now
            </Link>
          </div>
        </div>
      </div>

      {/* Who Can Use This */}
      <div className="w-full max-w-[1200px] px-4 md:px-10 mb-12">
        <motion.div
          className="bg-primary/5 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-primary dark:text-white mb-6 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'tractor', title: 'Employers/Farms', desc: 'Small, medium, and large-scale employers and farms' },
              { icon: 'industry', title: 'Agro-Processing', desc: 'Agro-processing companies' },
              { icon: 'flask', title: 'Research Projects', desc: 'Research and data-collection projects' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${item.icon} text-primary text-2xl`}></i>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Role-Based Recruitment */}
      <div className="w-full max-w-[1200px] px-4 md:px-10">
        <h2 className="text-3xl font-bold text-primary dark:text-white mb-8 text-center">Role-Based Recruitment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {[
            {
              title: 'Farm Hands',
              level: 'Skilled Labor',
              salary: 'GHS 1,200 - 1,500',
              tasks: ['Manual crop maintenance', 'Livestock feeding & care', 'Irrigation system monitoring', 'Harvesting operations'],
              requirements: ['Diploma/Certificate from accredited Training College', 'Physical fitness', 'Willingness to learn']
            },
            {
              title: 'Farm Managers',
              level: 'Management',
              salary: 'GHS 2,000+',
              tasks: ['P&L Oversight & Planning', 'Team leadership & HR', 'Supply chain management', 'Operational strategy'],
              requirements: ['BSc from accredited University', '3+ years experience', 'Leadership skills'],
              popular: true
            },
            {
              title: 'Interns / NSS',
              level: 'Students',
              salary: 'GHS 400 - 700',
              tasks: ['Research & data entry', 'Field observations', 'Academic project support', 'Peak season operational help'],
              requirements: ['Current student or NSS participant', 'Agriculture-related program', 'Institution verification']
            }
          ].map((tier, i) => (
            <motion.div
              key={i}
              className={`flex flex-col gap-6 rounded-xl border-2 border-solid ${
                tier.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-[#d3e4db] dark:border-white/10'
              } bg-white dark:bg-background-dark p-8 relative`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-[#101914] dark:text-white text-xl font-bold">{tier.title}</h3>
                <span className="text-primary text-[10px] uppercase tracking-widest font-bold bg-primary/10 px-2 py-1 rounded w-fit mb-4">
                  {tier.level}
                </span>
                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4 mb-4">
                  <p className="text-accent-gold text-xs font-bold uppercase tracking-wider mb-1">Salary Benchmark</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#101914] dark:text-white text-2xl font-black">{tier.salary}</span>
                    <span className="text-gray-500 text-sm font-medium">/mo</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-primary mb-2">Key Responsibilities:</p>
                {tier.tasks.map((task, j) => (
                  <div key={j} className="text-sm font-normal flex gap-3 text-gray-700 dark:text-gray-300">
                    <i className="fas fa-check-circle text-primary text-xl"></i>
                    {task}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Requirements:</p>
                {tier.requirements.map((req, j) => (
                  <div key={j} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <i className="fas fa-circle text-primary text-[6px] mt-1.5"></i>
                    {req}
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className={`mt-auto flex w-full items-center justify-center rounded-lg h-12 ${
                  tier.popular ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                } font-bold hover:brightness-110 transition-all`}
              >
                Request Talent
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="w-full max-w-[1200px] px-4 md:px-10 py-12">
        <h2 className="text-3xl font-bold text-primary dark:text-white mb-8 text-center">Why Choose AgroTalent Hub</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: 'map-marker-alt',
              title: 'Location-Based Matching',
              desc: 'Eastern Region graduates placed in Eastern Region farms. Reduces relocation challenges and ensures commitment.'
            },
            {
              icon: 'shield-check',
              title: 'Verified Graduates Only',
              desc: 'Only graduates from accredited Training Colleges and Universities. All credentials verified before placement.'
            },
            {
              icon: 'video',
              title: 'Structured Training',
              desc: 'Mandatory Zoom orientation sessions and pre-employment training. Digital attendance tracking included.'
            },
            {
              icon: 'filter',
              title: 'Advanced Filtering',
              desc: 'Filter by qualification, location, experience, and specialty (crop, livestock, agribusiness).'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-background-dark p-6 rounded-xl border border-primary/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className={`fas fa-${feature.icon} text-primary text-xl`}></i>
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full max-w-[1200px] px-4 md:px-10 py-12">
        <motion.div
          className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border-2 border-primary/20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400">One-time fee per successful placement</p>
          </div>
          <div className="max-w-md mx-auto bg-white dark:bg-background-dark rounded-xl p-8 border-2 border-primary shadow-lg">
            <div className="text-center">
              <div className="text-5xl font-black text-primary mb-2">GHS 200</div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Per Successful Placement</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm">One-time payment</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm">Only charged on successful placement</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm">Includes verification & training</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm">Ongoing support included</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
