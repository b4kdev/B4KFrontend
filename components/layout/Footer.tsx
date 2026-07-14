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
        <Link href="/help" className="font-mono hover:text-fg" style={{ transitionProperty: 'color', transitionDuration: 'var(--dur-micro)', transitionTimingFunction: 'var(--ease-linear)' }}>
          {t('help')}
        </Link>
        <Link href="/legal/privacy" className="font-mono hover:text-fg" style={{ transitionProperty: 'color', transitionDuration: 'var(--dur-micro)', transitionTimingFunction: 'var(--ease-linear)' }}>
          {t('privacy')}
        </Link>
        <Link href="/legal/terms" className="font-mono hover:text-fg" style={{ transitionProperty: 'color', transitionDuration: 'var(--dur-micro)', transitionTimingFunction: 'var(--ease-linear)' }}>
          {t('terms')}
        </Link>
        <Link href="/legal/cookies" className="font-mono hover:text-fg" style={{ transitionProperty: 'color', transitionDuration: 'var(--dur-micro)', transitionTimingFunction: 'var(--ease-linear)' }}>
          {t('cookies')}
        </Link>
        <span className="ml-auto text-f-xs text-muted-2">
          {t('copyright', { year: new Date().getFullYear() })}
        </span>
      </div>
    </footer>
  );
}
