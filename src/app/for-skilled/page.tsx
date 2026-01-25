import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'

export const metadata = {
  title: 'For Skilled Workers | AgroTalent Hub',
  description: 'Turn your farming experience into stable employment. Join AgroTalent Hub and connect with verified farms across Ghana.',
}

export default function ForSkilledPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-4 lg:px-10 py-16 bg-gradient-to-br from-accent/10 via-accent/5 to-background-light dark:from-accent/20 dark:via-accent/10 dark:to-background-dark">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="bg-accent/10 text-accent px-4 py-2 rounded-full text-xs font-bold w-fit mb-6">
                FOR SKILLED WORKERS
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-[#101914] dark:text-white mb-6">
                Your Experience Matters
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                No certificate? No problem! Join AgroTalent Hub and turn your years of farming experience 
                into stable, dignified employment with verified farms across Ghana.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup/skilled"
                  className="px-8 py-4 bg-accent text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all inline-flex items-center justify-center"
                >
                  Register Now
                  <i className="fas fa-arrow-right ml-2"></i>
                </Link>
                <Link
                  href="/jobs"
                  className="px-8 py-4 bg-white dark:bg-white/10 border-2 border-accent text-accent dark:text-white text-lg font-bold rounded-xl hover:bg-accent/5 transition-all inline-flex items-center justify-center"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ImageWithFallback
                src="/image_interns.webp"
                fallbackSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuAGNznEPrxWCuf7elCVh5Gv0WSp_50LmfAed2f-kyFKvmWXBhAkuA4j3szXKwF9cJ48vAEzhyGXqMor9BYKq0tdJxdw12l0XXnQpMKVATzDpKo6mO5cdBnfIktZaV-pEW-GZ-AoiC6mDQL6ofW8krhIppDk_7kj3rfTt1FNo0nFloYSlyolHztVyOi53XbpLK6pJPk9tuoBD0xtVUqCmvudP6kG2JadqlOs-8VPg-DI_eM6bXINiLHbuIvqMlCF0N1r0JjPPt5BcIU"
                alt="Skilled agricultural workers"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl border border-black/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            Why Join AgroTalent Hub?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We value your practical experience and connect you with farms that need your skills.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: 'handshake',
              title: 'Fair & Transparent',
              description: 'No middlemen, no exploitation. Direct connection with verified employers and fair wages.'
            },
            {
              icon: 'map-marked-alt',
              title: 'Work in Your Region',
              description: 'Find jobs near you. We match you with farms in your preferred region.'
            },
            {
              icon: 'shield-check',
              title: 'Verified & Protected',
              description: 'All employers are verified. Your rights and safety are our priority.'
            },
            {
              icon: 'money-bill-wave',
              title: 'Stable Income',
              description: 'Earn consistent wages with structured employment contracts.'
            },
            {
              icon: 'graduation-cap',
              title: 'Training Opportunities',
              description: 'Access free training sessions to enhance your skills and advance your career.'
            },
            {
              icon: 'certificate',
              title: 'Build Your Profile',
              description: 'Showcase your experience, get verified, and grow your professional reputation.'
            }
          ].map((benefit, index) => (
            <div
              key={index}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4">
                <i className={`fas fa-${benefit.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-[#101914] dark:text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Look For */}
      <section className="bg-gray-50 dark:bg-white/5 px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-6">
                What We Look For
              </h2>
              <ul className="space-y-4">
                {[
                  'Practical farming experience (even without certificates)',
                  'Hands-on knowledge of crops, livestock, or equipment',
                  'Willingness to learn and grow',
                  'Reliable and committed to quality work',
                  'Someone who can provide references (optional but helpful)'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-accent text-xl mt-0.5"></i>
                    <span className="text-gray-700 dark:text-gray-300 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-background-dark rounded-2xl border border-accent/20 p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-[#101914] dark:text-white mb-4">
                  What You'll Get
                </h3>
                <ul className="space-y-3">
                  {[
                    'Access to verified farm jobs across 16 regions',
                    'Fair wages and transparent payment',
                    'Free training and skill development',
                    'Professional profile to showcase your experience',
                    'Job matching based on your crops/livestock experience',
                    'Direct communication with employers'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <i className="fas fa-star text-accent text-sm mt-1"></i>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Four simple steps to start your journey with AgroTalent Hub
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              number: '1',
              title: 'Create Profile',
              description: 'Sign up and tell us about your farming experience, crops, livestock, and skills.',
              icon: 'user-plus'
            },
            {
              number: '2',
              title: 'Get Verified',
              description: 'Our team reviews your profile and references to ensure quality.',
              icon: 'shield-check'
            },
            {
              number: '3',
              title: 'Browse & Apply',
              description: 'Search for jobs in your region that match your experience and skills.',
              icon: 'search'
            },
            {
              number: '4',
              title: 'Start Working',
              description: 'Get hired, receive training if needed, and begin earning stable income.',
              icon: 'briefcase'
            }
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-center hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${step.icon} text-xl`}></i>
                </div>
                <h3 className="text-lg font-bold text-[#101914] dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              {index < 3 && (
                <i className="hidden md:block fas fa-arrow-right text-accent absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"></i>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Turn Your Experience Into Employment?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join over 1,250 workers who have found dignified agricultural employment through AgroTalent Hub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup/skilled"
              className="px-8 py-4 bg-white text-accent font-bold rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center justify-center text-lg"
            >
              Create Your Profile
              <i className="fas fa-arrow-right ml-2"></i>
            </Link>
            <Link
              href="/jobs"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white hover:bg-white/20 transition-colors inline-flex items-center justify-center text-lg"
            >
              View Available Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            Common Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: 'Do I need a certificate to register?',
              answer: 'No! We value your practical experience. You can register based on your years of farming work, skills, and references.'
            },
            {
              question: 'How do you verify my experience?',
              answer: 'We review your profile, check your references, and may conduct a brief interview to confirm your skills and experience.'
            },
            {
              question: 'What types of jobs are available?',
              answer: 'Farm hands, crop supervisors, livestock managers, equipment operators, and more. Jobs are matched to your specific experience with crops, livestock, or equipment.'
            },
            {
              question: 'How much can I earn?',
              answer: 'Salaries range from GHS 1,200 - 1,500 for farm hands to GHS 2,000+ for experienced managers, depending on your skills and the role.'
            },
            {
              question: 'Can I get training to improve my skills?',
              answer: 'Yes! We offer free training sessions and workshops to help you learn new techniques and advance your career.'
            },
            {
              question: 'What if I don\'t have a reference?',
              answer: 'References are optional but recommended. You can still register and we\'ll work with you to verify your experience through other means.'
            }
          ].map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6"
            >
              <h3 className="text-lg font-bold text-[#101914] dark:text-white mb-2 flex items-start gap-2">
                <i className="fas fa-question-circle text-accent mt-1"></i>
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 ml-7">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
