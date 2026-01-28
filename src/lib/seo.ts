// SEO Configuration for AgroTalent Hub - Ghana Focus
export const siteConfig = {
  name: 'AgroTalent Hub',
  description: 'Connecting agricultural talent with farms across Ghana. Find verified agricultural professionals, post farming jobs, and access training programs in all 16 regions of Ghana.',
  url: 'https://agrotalenthub.com',
  ogImage: '/og-image.jpg',
  links: {
    twitter: '',
    github: '',
  },
}

// Ghana Regions for SEO
export const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Western North',
  'Ahafo',
  'Bono',
  'Bono East',
  'Oti',
  'Savannah',
  'North East',
]

// Core Keywords
export const coreKeywords = [
  'agricultural jobs Ghana',
  'farm workers Ghana',
  'agricultural recruitment Ghana',
  'farming jobs Ghana',
  'agribusiness Ghana',
  'agricultural professionals Ghana',
  'farm management Ghana',
  'agricultural training Ghana',
  'crop farming Ghana',
  'livestock farming Ghana',
  'agricultural extension Ghana',
  'agricultural graduates Ghana',
  'farm employment Ghana',
  'agricultural careers Ghana',
  'agro jobs Ghana',
]

// Regional Keywords
export const regionalKeywords = ghanaRegions.flatMap(region => [
  `agricultural jobs ${region}`,
  `farm workers ${region}`,
  `farming jobs ${region}`,
  `agricultural recruitment ${region}`,
  `agribusiness ${region}`,
])

// Combined Keywords
export const allKeywords = [
  ...coreKeywords,
  ...regionalKeywords,
  'Ghana agriculture',
  'Ghana farming',
  'agricultural employment Ghana',
  'farm jobs',
  'agricultural talent',
  'farm recruitment',
  'agricultural placement',
  'agro talent hub',
  'agricultural workforce Ghana',
  'sustainable agriculture Ghana',
  'food security Ghana',
  'agricultural development Ghana',
]

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'AgroTalent Hub - Agricultural Jobs & Recruitment Platform in Ghana',
    description: 'Connect with verified agricultural professionals across all 16 regions of Ghana. Post farming jobs, find skilled workers, and access training programs. Serving Greater Accra, Ashanti, Western, Eastern, and all regions.',
    keywords: [
      ...allKeywords,
      'agricultural platform Ghana',
      'farm job portal Ghana',
      'agricultural marketplace Ghana',
    ],
  },
  about: {
    title: 'About AgroTalent Hub - Transforming Agriculture in Ghana',
    description: 'Learn about AgroTalent Hub\'s mission to connect agricultural talent with farms across Ghana. We support sustainable agriculture, food security, and economic development in all 16 regions.',
    keywords: [
      ...allKeywords,
      'about agro talent hub',
      'agricultural mission Ghana',
      'sustainable agriculture Ghana',
    ],
  },
  services: {
    title: 'Our Services - Agricultural Recruitment, Training & Placement in Ghana',
    description: 'Comprehensive agricultural services across Ghana: recruitment, training, placement, and farm management. Serving farms and agricultural professionals in all regions.',
    keywords: [
      ...allKeywords,
      'agricultural services Ghana',
      'recruitment services Ghana',
      'agricultural training programs',
      'farm placement services',
    ],
  },
  jobs: {
    title: 'Agricultural Jobs in Ghana - Find Farming Jobs Across All Regions',
    description: 'Browse agricultural and farming jobs across all 16 regions of Ghana. Find opportunities in crop farming, livestock, agribusiness, and agricultural management.',
    keywords: [
      ...allKeywords,
      'agricultural job listings Ghana',
      'farming job opportunities',
      'agricultural careers',
      'farm job search Ghana',
    ],
  },
  'for-farms': {
    title: 'For Farms & Employers - Find Agricultural Talent in Ghana',
    description: 'Post agricultural jobs and find verified, skilled workers for your farm or agribusiness across Ghana. Access qualified graduates, experienced workers, and students.',
    keywords: [
      ...allKeywords,
      'farm employers Ghana',
      'agricultural hiring',
      'farm recruitment services',
      'find farm workers',
    ],
  },
  'for-graduates': {
    title: 'For Agricultural Graduates - Find Jobs & Career Opportunities in Ghana',
    description: 'Agricultural graduates: Find verified job opportunities across Ghana. Connect with farms in Greater Accra, Ashanti, Western, Eastern, and all regions.',
    keywords: [
      ...allKeywords,
      'agricultural graduate jobs',
      'graduate opportunities Ghana',
      'agricultural careers for graduates',
    ],
  },
  'for-skilled': {
    title: 'For Skilled Agricultural Workers - Job Opportunities Across Ghana',
    description: 'Experienced agricultural workers: Find farming jobs across all regions of Ghana. Connect with farms seeking skilled professionals in crop and livestock farming.',
    keywords: [
      ...allKeywords,
      'skilled farm workers',
      'experienced agricultural workers',
      'agricultural professionals jobs',
    ],
  },
  'for-students': {
    title: 'For Agricultural Students - Internships & Training in Ghana',
    description: 'Agricultural students: Find internships, training programs, and entry-level opportunities across Ghana. Build your career in agriculture.',
    keywords: [
      ...allKeywords,
      'agricultural internships Ghana',
      'student opportunities',
      'agricultural training for students',
    ],
  },
  impact: {
    title: 'Our Impact - Transforming Agriculture & Creating Opportunities in Ghana',
    description: 'Discover how AgroTalent Hub is creating positive impact across Ghana: youth employment, skilled workforce development, rural empowerment, and food security.',
    keywords: [
      ...allKeywords,
      'agricultural impact Ghana',
      'youth employment agriculture',
      'rural development Ghana',
      'food security Ghana',
    ],
  },
  contact: {
    title: 'Contact Us - AgroTalent Hub Ghana',
    description: 'Get in touch with AgroTalent Hub. We serve farms and agricultural professionals across all 16 regions of Ghana.',
    keywords: [
      ...allKeywords,
      'contact agro talent hub',
      'agricultural support Ghana',
    ],
  },
  'help-center': {
    title: 'Help Center - Support for AgroTalent Hub Users in Ghana',
    description: 'Find answers to common questions about using AgroTalent Hub. Support for farms, graduates, students, and skilled workers across Ghana.',
    keywords: [
      ...allKeywords,
      'agro talent hub help',
      'support agriculture Ghana',
      'FAQ agricultural platform',
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy - AgroTalent Hub',
    description: 'Privacy policy for AgroTalent Hub. Learn how we protect your data and privacy.',
    keywords: ['privacy policy', 'data protection', 'AgroTalent Hub'],
  },
  'terms-of-service': {
    title: 'Terms of Service - AgroTalent Hub',
    description: 'Terms of service for AgroTalent Hub platform.',
    keywords: ['terms of service', 'AgroTalent Hub', 'user agreement'],
  },
}

// Generate structured data (JSON-LD) for organization
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AgroTalent Hub',
    url: 'https://agrotalenthub.com',
    logo: 'https://agrotalenthub.com/logo.png',
    description: 'Connecting agricultural talent with farms across Ghana',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GH',
      addressRegion: 'Ghana',
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English'],
    },
  }
}

// Generate JobPosting schema
export function generateJobPostingSchema(job: {
  title: string
  description: string
  location: string
  employmentType?: string
  datePosted?: string
  validThrough?: string
  baseSalary?: { value: number; currency: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'AgroTalent Hub',
    },
    datePosted: job.datePosted || new Date().toISOString(),
    validThrough: job.validThrough,
    employmentType: job.employmentType || 'FULL_TIME',
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressRegion: job.location,
        addressCountry: 'GH',
      },
    },
    baseSalary: job.baseSalary
      ? {
          '@type': 'MonetaryAmount',
          currency: job.baseSalary.currency || 'GHS',
          value: {
            '@type': 'QuantitativeValue',
            value: job.baseSalary.value,
            unitText: 'MONTH',
          },
        }
      : undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'AgroTalent Hub',
      sameAs: 'https://agrotalenthub.com',
    },
  }
}

// Generate WebSite schema with search action
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AgroTalent Hub',
    url: 'https://agrotalenthub.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://agrotalenthub.com/jobs?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
