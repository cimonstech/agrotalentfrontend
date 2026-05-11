/**
 * Helpers for the admin sourced-jobs catalog: fingerprint sources so the same
 * organisation does not split across rows when email/phone are stored in
 * different columns or duplicates appear in source_contact vs source_email.
 */

export type SourcedCatalogJobFields = {
  id: string
  title: string
  source_name: string | null
  source_contact_name: string | null
  source_contact: string | null
  source_phone: string | null
  source_email: string | null
  source_platform: string | null
  source_website: string | null
  source_platform_url: string | null
}

export type SourceGroupRow = {
  key: string
  source_name: string | null
  source_platform: string | null
  source_contact_name: string | null
  source_contact: string | null
  source_phone: string | null
  source_email: string | null
  source_website: string | null
  source_platform_url: string | null
  jobCount: number
  jobs: { id: string; title: string }[]
}

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeOrgName(name: string | null | undefined): string {
  return (name ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function normPlatform(platform: string | null | undefined): string {
  return (platform ?? '').toLowerCase().trim()
}

export function collectEmailsFromJob(job: SourcedCatalogJobFields): string[] {
  const s = new Set<string>()
  const e = job.source_email?.trim().toLowerCase()
  if (e) s.add(e)
  const c = job.source_contact?.trim()
  if (c && EMAIL_LIKE.test(c)) s.add(c.toLowerCase())
  return Array.from(s).sort()
}

export function collectPhonesFromJob(job: SourcedCatalogJobFields): string[] {
  const s = new Set<string>()
  const p = job.source_phone?.replace(/\D/g, '')
  if (p && p.length >= 9) s.add(p)
  const c = job.source_contact?.trim()
  if (
    c &&
    !EMAIL_LIKE.test(c) &&
    c.replace(/\D/g, '').length >= 9
  ) {
    s.add(c.replace(/\D/g, ''))
  }
  return Array.from(s).sort()
}

/** Stable fingerprint per job row before merging overlapping groups. */
export function sourceGroupKey(job: SourcedCatalogJobFields): string {
  const platform = normPlatform(job.source_platform)
  const org = normalizeOrgName(job.source_name)
  const emails = collectEmailsFromJob(job).join(',')
  const phones = collectPhonesFromJob(job).join(',')
  const joined = [platform, org, emails, phones].join('|')
  if (joined.replace(/\|/g, '').trim() === '') return `job:${job.id}`
  return joined
}

function pickBetter(
  current: string | null | undefined,
  incoming: string | null | undefined
): string | null {
  const c = current?.trim()
  if (c) return c
  const i = incoming?.trim()
  return i ? i : null
}

export function aggregateSourceGroups(
  jobs: SourcedCatalogJobFields[]
): SourceGroupRow[] {
  const map = new Map<string, SourceGroupRow>()
  for (const job of jobs) {
    const key = sourceGroupKey(job)
    const existing = map.get(key)
    const row = { id: job.id, title: job.title }
    if (!existing) {
      map.set(key, {
        key,
        source_name: job.source_name ?? null,
        source_platform: job.source_platform ?? null,
        source_contact_name: job.source_contact_name ?? null,
        source_contact: job.source_contact ?? null,
        source_phone: job.source_phone ?? null,
        source_email: job.source_email ?? null,
        source_website: job.source_website ?? null,
        source_platform_url: job.source_platform_url ?? null,
        jobCount: 1,
        jobs: [row],
      })
    } else {
      existing.jobCount += 1
      existing.jobs.push(row)
      existing.source_name = pickBetter(existing.source_name, job.source_name)
      existing.source_platform = pickBetter(
        existing.source_platform,
        job.source_platform
      )
      existing.source_contact_name = pickBetter(
        existing.source_contact_name,
        job.source_contact_name
      )
      existing.source_contact = pickBetter(
        existing.source_contact,
        job.source_contact
      )
      existing.source_phone = pickBetter(existing.source_phone, job.source_phone)
      existing.source_email = pickBetter(existing.source_email, job.source_email)
      existing.source_website = pickBetter(
        existing.source_website,
        job.source_website
      )
      existing.source_platform_url = pickBetter(
        existing.source_platform_url,
        job.source_platform_url
      )
    }
  }
  return Array.from(map.values())
}

function emailsOfGroup(g: SourceGroupRow): Set<string> {
  const s = new Set<string>()
  const e = g.source_email?.trim().toLowerCase()
  if (e) s.add(e)
  const c = g.source_contact?.trim()
  if (c && EMAIL_LIKE.test(c)) s.add(c.toLowerCase())
  return s
}

function phonesOfGroup(g: SourceGroupRow): Set<string> {
  const s = new Set<string>()
  const p = g.source_phone?.replace(/\D/g, '')
  if (p && p.length >= 9) s.add(p)
  return s
}

function overlaps<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size === 0 || b.size === 0) return false
  return Array.from(a).some((x) => b.has(x))
}

function mergeTwoGroups(a: SourceGroupRow, b: SourceGroupRow): SourceGroupRow {
  const seen = new Set<string>()
  const mergedJobs: { id: string; title: string }[] = []
  for (const j of [...a.jobs, ...b.jobs]) {
    if (!seen.has(j.id)) {
      seen.add(j.id)
      mergedJobs.push(j)
    }
  }
  const sortedIds = Array.from(seen).sort()
  const key = `merged:${sortedIds.join(':')}`
  return {
    key,
    source_name: pickBetter(a.source_name, b.source_name),
    source_platform: pickBetter(a.source_platform, b.source_platform),
    source_contact_name: pickBetter(
      a.source_contact_name,
      b.source_contact_name
    ),
    source_contact: pickBetter(a.source_contact, b.source_contact),
    source_phone: pickBetter(a.source_phone, b.source_phone),
    source_email: pickBetter(a.source_email, b.source_email),
    source_website: pickBetter(a.source_website, b.source_website),
    source_platform_url: pickBetter(
      a.source_platform_url,
      b.source_platform_url
    ),
    jobCount: mergedJobs.length,
    jobs: mergedJobs,
  }
}

/**
 * Merge rows that share platform + normalised org name and overlap on email or phone.
 * Handles legacy rows where one listing stored email only in source_contact and another in source_email.
 */
export function mergeOverlappingSourceGroups(
  rows: SourceGroupRow[]
): SourceGroupRow[] {
  let list = [...rows]
  let changed = true
  while (changed) {
    changed = false
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if (normPlatform(a.source_platform) !== normPlatform(b.source_platform))
          continue
        if (normalizeOrgName(a.source_name) !== normalizeOrgName(b.source_name))
          continue
        if (
          !overlaps(emailsOfGroup(a), emailsOfGroup(b)) &&
          !overlaps(phonesOfGroup(a), phonesOfGroup(b))
        )
          continue
        const merged = mergeTwoGroups(a, b)
        list.splice(j, 1)
        list.splice(i, 1, merged)
        changed = true
        break outer
      }
    }
  }
  return list.sort((a, b) => {
    const na = (a.source_name ?? a.source_platform ?? '').toLowerCase()
    const nb = (b.source_name ?? b.source_platform ?? '').toLowerCase()
    return na.localeCompare(nb)
  })
}

export function buildSourceCatalogGroups(
  jobs: SourcedCatalogJobFields[]
): SourceGroupRow[] {
  return mergeOverlappingSourceGroups(aggregateSourceGroups(jobs))
}

/** Single-line label for picker UI */
export function formatSourceGroupLabel(g: SourceGroupRow): string {
  const org = g.source_name?.trim() || 'Unknown organisation'
  const plat = g.source_platform?.trim()
    ? g.source_platform.replace(/_/g, ' ')
    : 'unknown platform'
  const emails = collectEmailsFromFields(g)
  const phones = collectPhonesFromFields(g)
  const tail = emails[0] ?? phones[0] ?? 'no email/phone'
  return `${org} · ${plat} · ${tail}`
}

export function collectEmailsFromFields(g: SourceGroupRow): string[] {
  const s = new Set<string>()
  const e = g.source_email?.trim().toLowerCase()
  if (e) s.add(e)
  const c = g.source_contact?.trim()
  if (c && EMAIL_LIKE.test(c)) s.add(c.toLowerCase())
  return Array.from(s).sort()
}

export function collectPhonesFromFields(g: SourceGroupRow): string[] {
  const s = new Set<string>()
  const p = g.source_phone?.replace(/\D/g, '')
  if (p && p.length >= 9) s.add(p)
  return Array.from(s).sort()
}

export function sourceGroupMatchesQuery(
  group: SourceGroupRow,
  raw: string
): boolean {
  const q = raw.trim().toLowerCase()
  if (!q) return true
  const hay = [
    group.source_name,
    group.source_platform,
    group.source_contact_name,
    group.source_contact,
    group.source_phone,
    group.source_email,
    group.source_website,
    group.source_platform_url,
    ...group.jobs.map((j) => j.title),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}
