// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  // Fallback so a missing env var in dev does not silently disable Sentry.
  'https://b60391457ffced9a807aac013260d89e@o4511339607359488.ingest.de.sentry.io/4511342146748496'

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV ?? 'development',

  // Don't report aborted requests (timeout, navigation, unmount) as errors
  ignoreErrors: [
    'AbortError',
    /signal is aborted/i,
    /aborted without reason/i,
  ],

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enableLogs: true,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
