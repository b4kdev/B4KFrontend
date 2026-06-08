'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Home, Map, LayoutGrid, Bookmark } from 'lucide-react';

const TABS = [
  { href: '/',        icon: Home,        labelKey: 'home' },
  { href: '/map',     icon: Map,         labelKey: 'map' },
  { href: '/explore', icon: LayoutGrid,  labelKey: 'explore' },
  { href: '/saved',   icon: Bookmark,    labelKey: 'saved' },
] as const;

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? /^\/[a-z-]+\/?$/.test(pathname) : pathname.includes(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 z-50 lg:hidden bg-bg-2"
      style={{
        borderTop: 'var(--bdr)',
        height: 'calc(var(--sp-12) + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label={t('bottomNav')}
    >
      {TABS.map(({ href, icon: Icon, labelKey }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-col items-center gap-[3px] px-4 py-1 rounded-lg flex-1 transition-colors',
              active ? 'text-lav' : 'text-muted',
            ].join(' ')}
            aria-label={t(labelKey)}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="text-[9px] font-semibold tracking-[0.04em]">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
