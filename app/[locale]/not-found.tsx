import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/library/Feedback';
import { linkButtonVariants } from '@/components/library/Button';

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
            className={linkButtonVariants()}
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
