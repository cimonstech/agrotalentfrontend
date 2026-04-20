/** True when href is exactly `/dashboard/{role}` with no deeper path segment intent. */
export function isDashboardRoleHomeHref(href: string): boolean {
  const h = href.replace(/\/$/, '') || '/'
  return /^\/dashboard\/(graduate|skilled|farm|student|admin)$/.test(h)
}

/**
 * Sidebar / nav active: exact match, or prefix match — except role home links
 * only match exactly (so "Dashboard" is not active on `/dashboard/graduate/jobs`).
 */
export function isDashboardNavActive(pathname: string, href: string): boolean {
  const p = (pathname || '/').replace(/\/$/, '') || '/'
  const h = href.replace(/\/$/, '') || '/'
  if (p === h) return true
  if (isDashboardRoleHomeHref(h)) return false
  return p.startsWith(h + '/')
}
