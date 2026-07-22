import * as Sentry from '@sentry/nextjs';

// PIPA note: no user identifiers, no default PII — crash telemetry only.
// See DEC-42-adjacent discussion, 2026-07-22.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
});
