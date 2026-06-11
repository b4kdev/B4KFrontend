'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Home, Map, LayoutGrid, Bookmark, User, Bell, X } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { href: '/',        icon: Home,        labelKey: 'home' },
  { href: '/map',     icon: Map,         labelKey: 'map' },
  { href: '/explore', icon: LayoutGrid,  labelKey: 'explore' },
  { href: '/saved',   icon: Bookmark,    labelKey: 'saved' },
] as const;

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return /^\/[a-z-]+\/?$/.test(pathname);
    const segment = pathname.replace(/^\/[a-z-]+/, '');
    return segment === href || segment.startsWith(`${href}/`);
  };

  const navLinkClass = (active: boolean) => [
    'flex items-center rounded-lg transition-colors duration-150',
    'min-h-touch',
    'lg:min-w-touch lg:justify-center',
    'w-full gap-3 px-3 lg:px-0',
    active ? 'bg-lav-dim text-lav' : 'text-muted hover:bg-muted-3 hover:text-fg',
  ].join(' ');

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-backdrop-50 z-[55] lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Rail */}
      <aside
        className={[
          'fixed left-0 top-0 h-screen z-[60] flex flex-col',
          'bg-bg-2',
          'w-[280px] lg:w-[52px]',
          'transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ borderRight: 'var(--bdr)' }}
      >
        {/* Logo */}
        <div className="flex items-center h-[52px] shrink-0" style={{ borderBottom: 'var(--bdr)' }}>
          <Link
            href="/"
            className="flex items-center justify-center w-[52px] h-full shrink-0"
            aria-label={t('logoHome')}
          >
            <img src="/logo.svg" alt="B4K" width={28} height={26} className="object-contain" />
          </Link>
          <span className="lg:hidden flex-1 text-fg text-sm font-semibold pl-2">Menu</span>
          <button
            className="lg:hidden min-w-touch min-h-touch flex items-center justify-center text-muted mr-1 shrink-0"
            onClick={onMobileClose}
            aria-label={t('menuClose')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-[2px] flex-1 px-[6px] pb-[6px] pt-sp-3" aria-label={t('mainNavigation')}>
          {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={t(labelKey)}
                onClick={onMobileClose}
                className={navLinkClass(active)}
              >
                <Icon size={17} strokeWidth={2} className="shrink-0" />
                <span className="lg:hidden text-f-md font-medium">{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom anchors: Notifications + Profile */}
        <div className="p-[6px] flex flex-col gap-[2px] shrink-0" style={{ borderTop: 'var(--bdr)' }}>
          <Link
            href="/notifications"
            aria-label={t('notifications')}
            onClick={onMobileClose}
            className={navLinkClass(isActive('/notifications'))}
          >
            <span className="relative shrink-0">
              <Bell size={17} strokeWidth={2} />
              <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-danger" />
            </span>
            <span className="lg:hidden text-f-md font-medium">{t('notifications')}</span>
          </Link>
          <Link
            href="/profile"
            aria-label={t('profile')}
            onClick={onMobileClose}
            className={navLinkClass(isActive('/profile'))}
          >
            <User size={17} strokeWidth={2} className="shrink-0" />
            <span className="lg:hidden text-f-md font-medium">{t('profile')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
