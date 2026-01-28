import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'

export default function ForStudentsPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-4 lg:px-10 py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background-light dark:from-primary/20 dark:via-primary/10 dark:to-background-dark">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold w-fit mb-6">
                FOR STUDENTS
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-[#101914] dark:text-white mb-6">
                Launch Your Agricultural Career
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                Find quality internships and NSS placements with verified farms. Bridge the gap between 
                classroom learning and real-world agricultural practice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup/student"
                  className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all inline-flex items-center justify-center"
                >
                  Create Profile
                  <i className="fas fa-arrow-right ml-2"></i>
                </Link>
                <Link
                  href="/jobs"
                  className="px-8 py-4 bg-white dark:bg-white/10 border-2 border-primary text-primary dark:text-white text-lg font-bold rounded-xl hover:bg-primary/5 transition-all inline-flex items-center justify-center"
                >
                  View Opportunities
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ImageWithFallback
                src="/Women_interns.webp"
                fallbackSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDTNeHX_vQtokDfBMjYoqBW6vhYwe0H04F1f4iU9784jP9ZhUuSBJp4vedRA9NWRgNMtVFYnjGDLXtKVfgjegmg7XHH-zOpBJoi6HY9s-r8YwSCt6DXZ0rr9oQG1m6EZ8f5f3f__xT7yWx6J5FZ73FPJUGmtRH4NEuHDBU2_9h8PGCDw5hPvJocBvW0J6wosqsevsZtIGbAvWQuI4PpIC_i81eicqPXSmvnK4SHFyfkWgCK1ZELr72Zyubab5GO9UIx9zBfFzv8Zx8"
                alt="Agriculture students"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl border border-black/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            Opportunities for Students
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We connect students with quality placements that provide real learning and career growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: 'user-graduate',
              title: 'NSS Placements',
              color: 'primary',
              benefits: [
                'Verified farms and agribusinesses',
                'Structured orientation and supervision',
                'Regional placement preferences honored',
                'Digital attendance and reporting'
              ]
            },
            {
              icon: 'briefcase',
              title: 'Internship Programs',
              color: 'accent',
              benefits: [
                'Hands-on practical experience',
                'Mentorship from experienced professionals',
                'Skill development opportunities',
                'Potential for permanent employment'
              ]
            }
          ].map((opportunity, index) => (
            <div
              key={index}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-8"
            >
              <div className={`w-16 h-16 ${opportunity.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'} rounded-xl flex items-center justify-center mb-6`}>
                <i className={`fas fa-${opportunity.icon} text-3xl`}></i>
              </div>
              <h3 className="text-2xl font-bold text-[#101914] dark:text-white mb-4">
                {opportunity.title}
              </h3>
              <ul className="space-y-3">
                {opportunity.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <i className={`fas fa-check-circle ${opportunity.color === 'primary' ? 'text-primary' : 'text-accent'} mt-0.5`}></i>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-gray-50 dark:bg-white/5 px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
              Student Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Kwame A.',
                school: 'University of Ghana',
                quote: 'My NSS placement through AgroTalent Hub gave me real-world experience and led to a full-time job offer!',
                role: 'NSS Placement → Farm Manager'
              },
              {
                name: 'Ama B.',
                school: 'Kwadaso Agric College',
                quote: 'The internship was well-structured with mentorship. I learned more in 3 months than in a year of lectures.',
                role: 'Intern → Crop Supervisor'
              },
              {
                name: 'Kofi M.',
                school: 'UDS Tamale',
                quote: 'I was matched with a farm near my hometown. Great experience and they hired me after graduation!',
                role: 'NSS Placement → Full-time'
              }
            ].map((story, index) => (
              <div
                key={index}
                className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-primary text-xl"></i>
                  </div>
                  <div>
                    <div className="font-bold text-[#101914] dark:text-white">{story.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{story.school}</div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic mb-4">"{story.quote}"</p>
                <div className="text-sm font-medium text-primary">{story.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Create your profile now and get matched with quality internships and NSS placements.
          </p>
          <Link
            href="/signup/student"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors text-lg"
          >
            Register as Student
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </section>
    </main>
  )
}
