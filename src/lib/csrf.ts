import { randomBytes, timingSafeEqual } from 'node:crypto'

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Constant-time comparison of the cookie token and header token.
 * Both must be present and identical (64 hex chars each).
 */
export function verifyCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) return false
  try {
    const a = Buffer.from(cookieToken, 'hex')
    const b = Buffer.from(headerToken, 'hex')
    if (a.length !== b.length || a.length !== 32) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
