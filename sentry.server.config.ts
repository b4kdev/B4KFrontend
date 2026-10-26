import * as Sentry from '@sentry/nextjs';
import { scrubBreadcrumb, scrubEvent } from '@/lib/sentry-scrub';

// PIPA note: no user identifiers, no default PII — crash telemetry only.
// See adjacent discussion, 2026-07-22.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});
