'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/library/Button';
import { EmptyState } from '@/components/library/Feedback';
import { fontVariables } from './fonts';
// This file replaces the ENTIRE root layout when the root layout itself
// throws — Next.js renders it as its own <html>/<body>, bypassing
// app/layout.tsx. Those imports never run here, so the tokens and base
// styles must be imported directly in this file too.
import './tokens.css';
import './globals.css';

// The root layout can throw before locale routing resolves, so next-intl has no context here.
// Static English copy (the Copy Deck's English rows) is the fallback for this boundary.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={fontVariables}>
      <body className="m-0 flex min-h-dvh items-center justify-center bg-ui-bg px-[var(--grid-gutter-mobile)] text-ui-fg type-body-base">
        <EmptyState type="error" title="Something went wrong" action={<Button onClick={reset}>Try again</Button>}>
          Something went wrong on our end. Try again, or come back later.
        </EmptyState>
      </body>
    </html>
  );
}
