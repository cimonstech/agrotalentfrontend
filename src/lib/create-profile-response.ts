export type CreateProfileResponse = {
  success?: boolean
  error?: string
  alreadyComplete?: boolean
  redirect?: string
  message?: string
}

export const ALREADY_SAVED_MESSAGE = 'Already saved. Redirecting…'
