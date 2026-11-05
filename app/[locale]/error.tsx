'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, linkButtonVariants } from '@/components/library/Button';
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
              className={linkButtonVariants({ variant: 'secondary' })}
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
