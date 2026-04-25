/** Persist that the user opened job browsing (list or detail) for onboarding checklist. */
export function markBrowseJobsComplete(userId: string | null | undefined): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem('ath-browse-jobs-' + userId, '1')
    window.dispatchEvent(new Event('ath-browse-jobs'))
  } catch {
    /* ignore */
  }
}
