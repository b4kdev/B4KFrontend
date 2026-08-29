'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';
// This file replaces the ENTIRE root layout when the root layout itself
// throws — Next.js renders it as its own <html>/<body>, bypassing
// app/layout.tsx. That import never runs here, so globals.css (and its
// CSS custom properties) must be imported directly in this file too.
import './globals.css';

// SC-4 — root layout can throw before locale routing resolves, so
// next-intl has no context here. Static English copy is the correct
// fallback for this specific boundary, not a hardcoded-string violation.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 min-h-screen flex items-center justify-center bg-bg font-body">
        <div className="flex flex-col items-center text-center px-sp-6 py-sp-20 max-w-[480px] w-full rounded-none bg-bg-2" style={{ border: '1px solid var(--bdr)' }}>
          <AlertTriangle size={48} strokeWidth={2} className="text-danger mb-sp-4" aria-hidden="true" />
          <p className="text-f-xl font-bold text-fg mb-sp-2 font-mono tracking-wide uppercase">
            SYS·ERR · APPLICATION FAILURE
          </p>
          <p className="text-f-md text-muted mb-sp-6 max-w-[300px]">
            Something on our end broke. Try again, or come back later.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center min-h-touch px-sp-5 rounded-full text-f-sm font-semibold bg-fg text-bg"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
