/** Dashboard entry paths after profile onboarding (role must be set). */
export const DASHBOARD_BY_ROLE: Record<string, string> = {
  farm: '/dashboard/farm',
  graduate: '/dashboard/graduate',
  student: '/dashboard/student',
  skilled: '/dashboard/skilled',
  admin: '/dashboard/admin',
}

export const APPLICATIONS_BY_ROLE: Record<string, string> = {
  graduate: '/dashboard/graduate/applications',
  student: '/dashboard/student/applications',
  skilled: '/dashboard/skilled/applications',
}

export function dashboardForRole(role: string | null | undefined): string | null {
  if (!role) return null
  return DASHBOARD_BY_ROLE[role] ?? null
}
