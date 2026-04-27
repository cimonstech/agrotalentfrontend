export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Brong Ahafo',
  'Western North',
  'Ahafo',
  'Bono',
  'Bono East',
  'Oti',
  'Savannah',
  'North East',
] as const

export const GHANA_CITIES: Record<string, string[]> = {
  'Greater Accra': [
    'Accra',
    'Tema',
    'Ashaiman',
    'Kasoa',
    'Madina',
    'Weija',
    'Adenta',
    'Dome',
    'Awoshie',
    'Dansoman',
    'Lapaz',
    'Achimota',
    'Teshie',
    'Prampram',
    'Dodowa',
    'Ada',
    'Nsawam',
  ],
  Ashanti: [
    'Kumasi',
    'Obuasi',
    'Ejisu',
    'Mampong',
    'Konongo',
    'Agogo',
    'Asante Mampong',
    'Ejura',
    'Bantama',
    'Aboabo',
  ],
  Western: ['Takoradi', 'Tarkwa', 'Prestea', 'Axim', 'Bibiani'],
  Eastern: [
    'Koforidua',
    'Nkawkaw',
    'Suhum',
    'Asamankese',
    'Oda',
    'Aburi',
    'Nsawam',
    'Atibie',
    'Juaso',
  ],
  Central: [
    'Cape Coast',
    'Elmina',
    'Saltpond',
    'Mankessim',
    'Assin Fosu',
    'Dunkwa',
  ],
  Volta: ['Ho', 'Hohoe', 'Kpando', 'Aflao', 'Keta', 'Anloga', 'Sogakope'],
  Northern: ['Tamale', 'Yendi', 'Bimbilla', 'Salaga'],
  'Upper East': ['Bolgatanga', 'Navrongo', 'Bawku', 'Zebilla', 'Nalerigu'],
  'Upper West': ['Wa', 'Lawra', 'Tumu', 'Jirapa', 'Nandom'],
  'Brong Ahafo': ['Sunyani', 'Techiman', 'Berekum', 'Wenchi', 'Dormaa', 'Kintampo'],
  'Western North': ['Sefwi', 'Enchi', 'Wiawso', 'Amenfi'],
  Ahafo: ['Goaso'],
  Bono: ['Sunyani'],
  'Bono East': ['Techiman', 'Atebubu', 'Kintampo'],
  Oti: ['Nkwanta', 'Jasikan'],
  Savannah: ['Damongo', 'Bole'],
  'North East': ['Nalerigu', 'Walewale'],
}

export const ALL_GHANA_CITIES = Object.values(GHANA_CITIES).flat()

export function getLocationScore(
  candidateRegion: string | null,
  candidateCity: string | null,
  preferredRegions: string[] | null,
  preferredCities: string[] | null,
  jobRegion: string | null,
  jobCity: string | null,
  acceptableRegions: string[] | null,
  acceptableCities: string[] | null
): number {
  if (!jobRegion && !acceptableRegions?.length) return 0.5

  const candidateRegions = [
    candidateRegion,
    ...(preferredRegions ?? []),
  ].filter(Boolean) as string[]

  const candidateCities = [
    candidateCity,
    ...(preferredCities ?? []),
  ].filter(Boolean) as string[]

  let bestScore = 0

  if (acceptableCities && acceptableCities.length > 0) {
    for (const city of candidateCities) {
      const match = acceptableCities.some(
        (ac) => ac.toLowerCase().trim() === city.toLowerCase().trim()
      )
      if (match) {
        bestScore = Math.max(bestScore, 1.0)
      }
    }
  }

  if (acceptableRegions && acceptableRegions.length > 0) {
    for (const region of candidateRegions) {
      if (acceptableRegions.includes(region)) {
        if (
          jobCity &&
          candidateCities.some((c) => c.toLowerCase() === jobCity.toLowerCase())
        ) {
          bestScore = Math.max(bestScore, 1.0)
        } else {
          bestScore = Math.max(bestScore, 0.7)
        }
      }
    }
  }

  if (jobRegion) {
    for (const region of candidateRegions) {
      if (region === jobRegion) {
        if (jobCity) {
          const cityMatch = candidateCities.some(
            (c) => c.toLowerCase().trim() === jobCity.toLowerCase().trim()
          )
          if (cityMatch) {
            bestScore = Math.max(bestScore, 1.0)
          } else {
            bestScore = Math.max(bestScore, 0.6)
          }
        } else {
          bestScore = Math.max(bestScore, 0.8)
        }
      }
    }
  }

  return bestScore
}
