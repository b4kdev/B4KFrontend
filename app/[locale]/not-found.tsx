import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/library/Feedback';

// Fallback outside the v2 shell (every address is served by components/v2, whose own
// not-found is the Page not found screen). Same texts and Empty state.
export default function NotFound() {
  const t = useTranslations('boundary.notFound');

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ui-bg px-[var(--grid-gutter-mobile)]">
      <EmptyState
        title={t('title')}
        action={
          <Link
            href="/"
            className="inline-flex h-[var(--control-height-lg)] items-center rounded-control bg-button-primary-bg px-[var(--space-5)] shadow-accent type-label-button text-button-primary-fg focus-visible:shadow-focus-ring focus-visible:outline-none"
          >
            {t('cta')}
          </Link>
        }
      >
        {t('desc')}
      </EmptyState>
    </main>
  );
}
