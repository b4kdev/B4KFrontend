'use client';

import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Home, Map, LayoutGrid, Bookmark } from 'lucide-react';

// H10 (DEC-06): Profile removed from the tab bar → lives in the hamburger drawer.
// H13 (S-IGOSPS): on mobile, Saved opens the Saved BottomSheet over the map
// (/map?saved=1) rather than the full /saved page (which serves desktop).
const TABS = [
  { href: '/',            icon: Home,        labelKey: 'home' },
  { href: '/map',         icon: Map,         labelKey: 'map' },
  { href: '/explore',     icon: LayoutGrid,  labelKey: 'explore' },
  { href: '/map?saved=1', icon: Bookmark,    labelKey: 'saved' },
] as const;

export default function MobileBottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '' : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-sp-2 z-50 lg:hidden bg-bg-2"
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
              'flex flex-col items-center gap-sp-1 px-sp-4 py-sp-1 flex-1 transition-colors min-h-touch justify-center',
              active ? 'text-lav' : 'text-muted',
            ].join(' ')}
            aria-label={t(labelKey)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
            <span className="text-f-xxs font-semibold tracking-[0.04em]">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
