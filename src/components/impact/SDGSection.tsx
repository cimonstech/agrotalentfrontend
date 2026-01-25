'use client'

import ImageWithFallback from '@/components/ImageWithFallback'

interface SDG {
  number: number
  title: string
  description: string
}

interface SDGSectionProps {
  variant?: 'default' | 'compact'
  showTitle?: boolean
}

export function SDGSection({ variant = 'default', showTitle = true }: SDGSectionProps) {
  const sdgs: SDG[] = [
    {
      number: 8,
      title: 'Decent Work and Economic Growth',
      description: 'Promoting decent work, fair pay, and economic empowerment in agriculture.'
    },
    {
      number: 2,
      title: 'Zero Hunger',
      description: 'Strengthening agriculture by connecting skilled talent to farms and agribusinesses.'
    },
    {
      number: 4,
      title: 'Quality Education',
      description: 'Bridging education and employment through training, internships, and workforce readiness.'
    },
    {
      number: 10,
      title: 'Reduced Inequalities',
      description: 'Expanding access to opportunities for rural and underserved communities.'
    },
    {
      number: 1,
      title: 'No Poverty',
      description: 'Supporting sustainable livelihoods and income security through employment.'
    }
  ]

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h3 className="text-xl font-bold text-[#101914] dark:text-white text-center">
            Contributing to UN Sustainable Development Goals
          </h3>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {sdgs.map((sdg) => (
            <div key={sdg.number} className="group relative">
              <ImageWithFallback
                src={`/Sustainable_Development_Goal_${sdg.number}.webp`}
                fallbackSrc={`https://via.placeholder.com/80?text=SDG+${sdg.number}`}
                alt={`SDG ${sdg.number}: ${sdg.title}`}
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg shadow-md hover:shadow-xl transition-shadow"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  {sdg.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101914] dark:text-white mb-4">
            Our Impact & SDG Alignment
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
            AgroTalent Hub contributes to the United Nations Sustainable Development Goals by promoting 
            decent work, strengthening agricultural productivity, supporting education-to-employment pathways, 
            and empowering rural communities.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sdgs.map((sdg) => (
          <div
            key={sdg.number}
            className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <ImageWithFallback
                src={`/Sustainable_Development_Goal_${sdg.number}.webp`}
                fallbackSrc={`https://via.placeholder.com/80?text=SDG+${sdg.number}`}
                alt={`SDG ${sdg.number}: ${sdg.title}`}
                className="w-20 h-20 rounded-lg shadow-md flex-shrink-0"
              />
              <div>
                <h3 className="font-bold text-[#101914] dark:text-white mb-2">
                  SDG {sdg.number}: {sdg.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {sdg.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
