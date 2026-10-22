'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/library/Button';
import { EmptyState } from '@/components/library/Feedback';

// Fallback outside the v2 shell (v2 pages have their own error screen).
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('boundary.error');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ui-bg px-[var(--grid-gutter-mobile)]">
      <EmptyState
        type="error"
        title={t('title')}
        action={
          <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
            <Button onClick={reset}>{t('cta')}</Button>
            <Link
              href="/"
              className="inline-flex h-[var(--control-height-lg)] items-center border border-ui-border-strong px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              {t('goHome')}
            </Link>
          </div>
        }
      >
        {t('desc')}
      </EmptyState>
    </main>
  );
}
