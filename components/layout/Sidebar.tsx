'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { Home, Map, LayoutGrid, Bookmark, User, Bell, Settings, LogOut } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useProfile } from '@/hooks/useProfile';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

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
  const tProfile = useTranslations('profile');
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const { open } = useAuthGate();
  const { data: profile } = useProfile();
  const isGuest = !loading && !session;
  const { data: unreadData } = useSWR<{ count: number }>(
    '/api/notifications/unread-count', fetcher, { refreshInterval: 60_000 },
  );
  const hasUnread = (unreadData?.count ?? 0) > 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await createSupabaseBrowserClient().auth.signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return /^\/[a-z-]+\/?$/.test(pathname);
    const segment = pathname.replace(/^\/[a-z-]+/, '');
    return segment === href || segment.startsWith(`${href}/`);
  };

  const railStyle: CSSProperties = {
    transitionProperty: 'color, background-color',
    transitionDuration: 'var(--dur-micro)',
    transitionTimingFunction: 'var(--ease-linear)',
  };

  const railClass = (active: boolean) => [
    'flex items-center justify-center min-w-touch min-h-touch rounded-none',
    active ? 'bg-lav-dim text-lav' : 'text-fg hover:bg-muted-3',
  ].join(' ');

  const iconStyle = (active: boolean): CSSProperties =>
    active ? {} : { opacity: 0.35 };

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-screen z-[60] flex-col w-[50px] bg-bg-2"
      style={{ borderRight: 'var(--bdr)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-[50px] shrink-0" style={{ borderBottom: 'var(--bdr)' }}>
        <Link href="/" prefetch={false} className="flex items-center justify-center w-full h-full" aria-label={t('logoHome')}>
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
            // prefetch={false} — this rail renders on every page, so the
            // default Link prefetch would otherwise re-run Home's 13
            // uncached widget fetches (and Map/Saved's own fetches) in the
            // background on every single page view.
            <Link
              key={href}
              href={target}
              prefetch={false}
              aria-label={t(labelKey)}
              aria-current={isActive(href) ? 'page' : undefined}
              className={railClass(isActive(href))}
              style={railStyle}
            >
              <Icon size={24} strokeWidth={2} className="shrink-0" style={iconStyle(isActive(href))} />
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
            style={railStyle}
          >
            <Bell size={24} strokeWidth={2} style={{ opacity: 0.35 }} />
          </button>
        ) : (
          <Link
            href="/notifications"
            prefetch={false}
            aria-label={t('notifications')}
            aria-current={isActive('/notifications') ? 'page' : undefined}
            className={railClass(isActive('/notifications'))}
            style={railStyle}
          >
            <span className="relative shrink-0">
              <Bell size={24} strokeWidth={2} style={iconStyle(isActive('/notifications'))} />
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
            style={railStyle}
          >
            <User size={24} strokeWidth={2} style={{ opacity: 0.35 }} />
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label={t('profile')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              className={railClass(isActive('/profile') || menuOpen)}
              style={railStyle}
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <User size={24} strokeWidth={2} className="shrink-0" style={iconStyle(isActive('/profile') || menuOpen)} />
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label={t('profile')}
                className="absolute left-full bottom-0 ml-sp-2 w-[180px] rounded-none bg-bg-2 py-sp-1 z-[70]"
                style={{ border: 'var(--bdr)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                <Link
                  href="/profile"
                  prefetch={false}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-sp-3 min-h-touch px-sp-4 text-f-sm font-medium text-fg hover:bg-muted-3"
                >
                  <User size={18} strokeWidth={2} className="shrink-0 opacity-60" />
                  {t('profile')}
                </Link>
                <Link
                  href="/profile/settings"
                  prefetch={false}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-sp-3 min-h-touch px-sp-4 text-f-sm font-medium text-fg hover:bg-muted-3"
                >
                  <Settings size={18} strokeWidth={2} className="shrink-0 opacity-60" />
                  {tProfile('tabs.settings')}
                </Link>
                <div style={{ borderTop: 'var(--bdr)' }} className="my-sp-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex items-center gap-sp-3 w-full min-h-touch px-sp-4 text-f-sm font-medium text-danger hover:bg-muted-3"
                >
                  <LogOut size={18} strokeWidth={2} className="shrink-0" />
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
