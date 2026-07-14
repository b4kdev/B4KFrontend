'use client';

import Image from 'next/image';
import useSWR from 'swr';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/i18n/navigation';
import { Home, Map, LayoutGrid, Bookmark, User, Bell, LogIn } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAuthGate } from '@/contexts/AuthGateContext';

// Desktop-only SideNav rail (SN_01–07). The mobile hamburger menu is a
// separate component (MobileDrawer) per DEC-06 — this rail is hidden < lg.
// TODO(L8): collapsible '>>' toggle deferred — expanding the rail would
// require converting the hardcoded `lg:left-[50px]` content offset (used in
// TopNav, MapView, ItineraryDetailView) to a shared variable; low priority.

const NAV_ITEMS = [
  { href: '/',        icon: Home,        labelKey: 'home' },
  { href: '/map',     icon: Map,         labelKey: 'map' },
  { href: '/explore', icon: LayoutGrid,  labelKey: 'explore' },
  { href: '/saved',   icon: Bookmark,    labelKey: 'saved' },
] as const;

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const { open } = useAuthGate();
  const isGuest = !loading && !session;
  const { data: unreadData } = useSWR<{ count: number }>(
    '/api/notifications/unread-count', fetcher, { refreshInterval: 60_000 },
  );
  const hasUnread = (unreadData?.count ?? 0) > 0;

  const isActive = (href: string) => {
    if (href === '/') return /^\/[a-z-]+\/?$/.test(pathname);
    const segment = pathname.replace(/^\/[a-z-]+/, '');
    return segment === href || segment.startsWith(`${href}/`);
  };

  const railClass = (active: boolean) => [
    'flex items-center justify-center min-w-touch min-h-touch rounded-none transition-colors duration-150',
    active ? 'bg-lav-dim text-lav' : 'text-muted hover:bg-muted-3 hover:text-fg',
  ].join(' ');

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-screen z-[60] flex-col w-[50px] bg-bg-2"
      style={{ borderRight: 'var(--bdr)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-[50px] shrink-0" style={{ borderBottom: 'var(--bdr)' }}>
        <Link href="/" className="flex items-center justify-center w-full h-full" aria-label={t('logoHome')}>
          <Image src="/logo.svg" alt="B4K" width={28} height={26} className="object-contain" />
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-[2px] flex-1 px-[6px] pt-sp-3" aria-label={t('mainNavigation')}>
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          // SC-31 (S-HDTVGP) — already on /map: keep map context, open the
          // embedded Saved Hub instead of navigating to the standalone page.
          const target = href === '/saved' && isActive('/map') ? '/map?saved=1' : href;
          return (
            <Link
              key={href}
              href={target}
              aria-label={t(labelKey)}
              aria-current={isActive(href) ? 'page' : undefined}
              className={railClass(isActive(href))}
            >
              <Icon size={24} strokeWidth={2} className="shrink-0" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom anchors: Notifications + Profile — M18: guests are gated (variant #6) */}
      <div className="p-sp-2 flex flex-col gap-[2px] shrink-0" style={{ borderTop: 'var(--bdr)' }}>
        {isGuest ? (
          <button
            type="button"
            aria-label={t('notifications')}
            onClick={() => open('profile_nav')}
            className={railClass(false)}
          >
            <Bell size={24} strokeWidth={2} />
          </button>
        ) : (
          <Link
            href="/notifications"
            aria-label={t('notifications')}
            aria-current={isActive('/notifications') ? 'page' : undefined}
            className={railClass(isActive('/notifications'))}
          >
            <span className="relative shrink-0">
              <Bell size={24} strokeWidth={2} />
              {hasUnread && (
                <span
                  className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-danger"
                  aria-hidden="true"
                />
              )}
            </span>
          </Link>
        )}

        {isGuest ? (
          <button
            type="button"
            aria-label={t('signIn')}
            onClick={() => open('profile_nav')}
            className={railClass(false)}
          >
            <LogIn size={24} strokeWidth={2} />
          </button>
        ) : (
          <Link
            href="/profile"
            aria-label={t('profile')}
            aria-current={isActive('/profile') ? 'page' : undefined}
            className={railClass(isActive('/profile'))}
          >
            <User size={24} strokeWidth={2} className="shrink-0" />
          </Link>
        )}
      </div>
    </aside>
  );
}
