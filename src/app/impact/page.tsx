import { ImpactMetrics } from '@/components/impact/ImpactMetrics'
import { SDGSection } from '@/components/impact/SDGSection'

export default function ImpactPage() {
  const impactAreas = [
    {
      icon: 'user-graduate',
      title: 'Youth Employment & Dignified Work',
      points: [
        'Connecting trained graduates and students directly to real agricultural jobs',
        'Reducing unemployment and underemployment',
        'Turning agriculture into a respected, structured career path, not a last resort'
      ],
      impact: 'Young people earn stable income and gain professional experience.'
    },
    {
      icon: 'users-cog',
      title: 'Skilled Workforce for Agriculture',
      points: [
        'Ensuring workers are trained before deployment',
        'Matching people by location and skill',
        'Reducing trial-and-error hiring by farms'
      ],
      impact: 'Farms become more productive, safer, and efficient.'
    },
    {
      icon: 'map-marked-alt',
      title: 'Rural Economic Empowerment',
      points: [
        'Keep jobs within local communities',
        'Reduce rural–urban migration',
        'Strengthen local economies'
      ],
      impact: 'Money circulates within rural areas instead of draining to cities.'
    },
    {
      icon: 'shield-alt',
      title: 'Safer & More Ethical Recruitment',
      points: [
        'Removing exploitation by middlemen',
        'Providing transparent recruitment and payroll',
        'Ensuring workers are verified and paid fairly'
      ],
      impact: 'Workers are protected, employers are confident, and abuse is reduced.'
    },
    {
      icon: 'graduation-cap',
      title: 'Education-to-Employment Transition',
      points: [
        'Bridging the gap between training institutions and industry',
        'Supporting NSS students, interns, and fresh graduates',
        'Giving practical field exposure'
      ],
      impact: 'Education becomes relevant and employment-ready.'
    },
    {
      icon: 'seedling',
      title: 'Agricultural Productivity & Food Security',
      points: [
        'Farms harvest more efficiently',
        'Mechanisation is properly handled',
        'Crop losses are reduced'
      ],
      impact: 'Stronger food systems and national food security.'
    }
  ]

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background-light dark:from-primary/20 dark:via-primary/10 dark:to-background-dark px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
            MAKING A DIFFERENCE
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-[#101914] dark:text-white mb-6">
            Our Impact on Society
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
            Transforming agricultural employment, empowering communities, and building a sustainable future for Ghana.
          </p>
          
          <ImpactMetrics />
        </div>
      </section>

      {/* Impact Areas */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            Real Impact We're Making
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Every placement, every training session, and every connection creates ripples of positive change across Ghana's agricultural sector.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {impactAreas.map((area, index) => (
            <div
              key={index}
              className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas fa-${area.icon} text-xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-[#101914] dark:text-white">
                  {area.title}
                </h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">What we do:</p>
                <ul className="space-y-2">
                  {area.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <i className="fas fa-check-circle text-primary mt-0.5 flex-shrink-0"></i>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                <p className="text-sm font-semibold text-primary dark:text-primary">
                  <i className="fas fa-bullseye mr-2"></i>
                  Impact: <span className="text-gray-700 dark:text-gray-300 font-normal">{area.impact}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SDG Section */}
      <section className="bg-gray-50 dark:bg-white/5 px-4 lg:px-10 py-16">
        <div className="max-w-[1200px] mx-auto">
          <SDGSection />
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-10 py-16">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Be Part of the Solution
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Whether you're a farm looking for skilled workers or a graduate seeking meaningful employment, 
            join us in building a stronger agricultural sector.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/for-farms"
              className="px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              I'm a Farm Owner
              <i className="fas fa-arrow-right ml-2"></i>
            </a>
            <a
              href="/for-graduates"
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white hover:bg-white/20 transition-colors inline-flex items-center justify-center"
            >
              I'm a Graduate
              <i className="fas fa-arrow-right ml-2"></i>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
