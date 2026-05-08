import * as Sentry from '@sentry/nextjs'

const dsn =
  process.env.SENTRY_DSN ??
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  'https://b60391457ffced9a807aac013260d89e@o4511339607359488.ingest.de.sentry.io/4511342146748496'

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enableLogs: true,
  sendDefaultPii: false,
})
