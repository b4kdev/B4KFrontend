'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const HIDDEN_ON = ['/map'];

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');

  if (HIDDEN_ON.some(p => pathname.includes(p))) return null;

  return (
    <footer
      className="mt-auto px-sp-4 lg:px-sp-8 py-sp-6"
      style={{ borderTop: 'var(--bdr)' }}
    >
      <div className="flex flex-wrap items-center gap-x-sp-4 gap-y-sp-2 text-f-xs text-muted">
        <Link href="/help" className="hover:text-fg transition-colors">
          {t('help')}
        </Link>
        <Link href="/legal/privacy" className="hover:text-fg transition-colors">
          {t('privacy')}
        </Link>
        <Link href="/legal/terms" className="hover:text-fg transition-colors">
          {t('terms')}
        </Link>
        <Link href="/legal/cookies" className="hover:text-fg transition-colors">
          {t('cookies')}
        </Link>
        <span className="ml-auto text-f-xs text-muted-2">
          {t('copyright', { year: new Date().getFullYear() })}
        </span>
      </div>
    </footer>
  );
}
