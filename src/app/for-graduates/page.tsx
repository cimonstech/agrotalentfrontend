'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ForGraduatesPage() {
  return (
    <main className="flex flex-col items-center">
      <section className="w-full px-4 lg:px-10 py-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="relative overflow-hidden rounded-xl min-h-[520px] flex items-center">
            <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCdRYznYH0H4DkWO3wANtklpRO3QK1u2BGGskJ5FkVbLemvTAsxvmxGvg45FNl_lR_NnExGQfKKGIpenZm2vIkVJ-Q1R_NiwOFvOxuAR9Z4S9SK4h0kHg-b9Lo6KnxIp1QKHpcg5s8HCLLI8wXgcvnwopDPu6_KY-JuohCJE-9Rj2ZofdS2EMpCp47WF039V8UQP31XfN0kwhMOhnqcDhGhqqizjL9u8th3W3XiAgMr_MK5qunmtV04-qw52GxtLuXGdDWEjnHDlAA")`, backgroundSize: 'cover'}}></div>
            <div className="relative z-10 p-10 md:p-16 max-w-2xl text-left">
              <h1 className="text-white text-4xl md:text-6xl font-black leading-tight mb-6">Structured Opportunities for Agriculture Graduates</h1>
              <p className="text-white/90 text-lg mb-8 leading-relaxed">Fair access to jobs and internships. Structured onboarding and training. Reduced exploitation and underpayment.</p>
              <Link href="/signup" className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform inline-block">
                Create Your Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="w-full px-4 lg:px-10 py-16 bg-primary/5">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="bg-white dark:bg-background-dark rounded-2xl p-8 border-2 border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-6 text-center">Eligibility Requirements</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-university text-primary"></i>
                  Accredited Universities
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Graduates from accredited universities with agriculture-related programs:
                </p>
                <ul className="space-y-2">
                  {['BSc Agriculture', 'BSc Agronomy', 'BSc Animal Science', 'BSc Agricultural Economics', 'BSc Crop Science'].map((prog, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check text-primary text-xs"></i>
                      {prog}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-graduation-cap text-primary"></i>
                  Accredited Training Colleges
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Graduates from accredited agricultural training colleges:
                </p>
                <ul className="space-y-2">
                  {['Diploma in Agriculture', 'Certificate in Agriculture', 'Agricultural Extension', 'Farm Management'].map((prog, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <i className="fas fa-check text-primary text-xs"></i>
                      {prog}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <i className="fas fa-info-circle text-accent mr-2"></i>
                <strong>Note:</strong> All credentials are verified before approval. Only graduates from recognized institutions are accepted.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Path Selection */}
      <section className="w-full px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-primary dark:text-white mb-8 text-center">Choose Your Path</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="group cursor-pointer bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-primary p-8 rounded-2xl shadow-sm transition-all"
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <i className="fas fa-graduation-cap text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Agricultural Professionals</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For graduates from Training Colleges and Universities seeking full-time positions as Farm Hands or Farm Managers.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Verified credentials only</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Location-based matching</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Structured training included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Fair salary benchmarks</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full border-2 border-primary text-primary group-hover:bg-primary group-hover:text-white py-3 rounded-lg font-bold transition-all text-center">
                Register as Graduate
              </Link>
            </motion.div>
            <motion.div
              className="group cursor-pointer bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-primary p-8 rounded-2xl shadow-sm transition-all"
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <i className="fas fa-briefcase text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Students & NSS</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For current students and National Service Scheme (NSS) participants seeking internship or service placements.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>NSS Agriculture placements</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Internship opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Institution verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span>Regional preference matching</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full border-2 border-primary text-primary group-hover:bg-primary group-hover:text-white py-3 rounded-lg font-bold transition-all text-center">
                Register as Student/NSS
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Regional Placement */}
      <section className="w-full px-4 lg:px-10 py-16 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">Regional Placement Policy</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We prioritize regional matching to reduce relocation challenges and ensure commitment. Eastern Region graduates are matched with Eastern Region farms, and so on.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { region: 'Northern Regions', icon: 'map-marker-alt', desc: 'Tamale, Bolgatanga, Wa' },
              { region: 'Middle Belt', icon: 'map-marker-alt', desc: 'Kumasi, Sunyani, Techiman' },
              { region: 'Southern Regions', icon: 'map-marker-alt', desc: 'Accra, Cape Coast, Koforidua' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-background-dark p-6 rounded-xl border border-primary/10 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${item.icon} text-primary text-2xl`}></i>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.region}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="w-full px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl font-bold text-primary dark:text-white mb-12 text-center">Benefits for Graduates & Students</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'handshake',
                title: 'Fair Access',
                desc: 'Equal opportunities for all verified graduates. No exploitation or underpayment.'
              },
              {
                icon: 'graduation-cap',
                title: 'Structured Training',
                desc: 'Mandatory Zoom orientation and pre-employment training to prepare you for success.'
              },
              {
                icon: 'shield-alt',
                title: 'Protection',
                desc: 'Verified employers, fair salary benchmarks, and ongoing support throughout your placement.'
              }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${benefit.icon} text-primary text-3xl`}></i>
                </div>
                <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
