'use client';

import { useState } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Bell, Settings, Globe, HelpCircle, FileText, LogIn, LogOut, User, X, ChevronRight,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useProfile } from '@/hooks/useProfile';

const LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'] as const;

const LEGAL_LINKS = [
  { key: 'legalTerms',   href: '/legal/terms' },
  { key: 'legalPrivacy', href: '/legal/privacy' },
  { key: 'legalCookies', href: '/legal/cookies' },
] as const;

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const t = useTranslations('nav');
  const tProfile = useTranslations('profile');
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const { data: profile } = useProfile();
  const { open: openGate } = useAuthGate();
  const { data: unreadData } = useSWR<{ count: number }>(
    '/api/notifications/unread-count', fetcher, { refreshInterval: 60_000 },
  );
  const hasUnread = (unreadData?.count ?? 0) > 0;

  const [langExpanded, setLangExpanded] = useState(false);
  const [legalExpanded, setLegalExpanded] = useState(false);

  const isLoading = loading;
  const isGuest = !loading && !session;

  const rowClass =
    'flex items-center gap-sp-3 w-full min-h-touch px-sp-4 text-f-base font-medium text-fg hover:bg-muted-3 transition-colors';

  const gatedOrLink = (href: string, label: string, icon: React.ReactNode, badge?: boolean) =>
    isGuest ? (
      <button type="button" className={rowClass} onClick={() => { openGate('profile_nav'); onClose(); }}>
        {icon}
        <span className="flex-1 text-left">{label}</span>
      </button>
    ) : (
      <Link href={href} className={rowClass} onClick={onClose}>
        <span className="relative shrink-0 flex items-center">
          {icon}
          {badge && hasUnread && (
            <span className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full bg-danger" aria-hidden="true" />
          )}
        </span>
        <span className="flex-1">{label}</span>
      </Link>
    );

  const changeLocale = (locale: string) => {
    onClose();
    router.replace(pathname, { locale });
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-backdrop-50 z-[55] lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      {/* Drawer — slides in from the right */}
      <aside
        className={[
          'fixed right-0 top-0 h-screen w-[300px] max-w-[85vw] z-[60] flex flex-col bg-bg-2 lg:hidden',
          'transition-transform ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ borderLeft: 'var(--bdr)', transitionDuration: 'var(--dur-reveal)' }}
        role="dialog"
        aria-label={t('mainNavigation')}
      >
        {/* Header: close */}
        <div className="flex items-center justify-end h-[50px] shrink-0 px-sp-2" style={{ borderBottom: 'var(--bdr)' }}>
          <button
            type="button"
            className="min-w-touch min-h-touch flex items-center justify-center text-muted"
            onClick={onClose}
            aria-label={t('menuClose')}
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Top: identity */}
        <div className="p-sp-4" style={{ borderBottom: 'var(--bdr)' }}>
          {isLoading ? (
            <div className="flex items-center gap-sp-3 animate-pulse" aria-hidden="true">
              <div className="w-12 h-12 rounded-full bg-muted-3" />
              <div className="flex-1 space-y-sp-2">
                <div className="h-4 w-2/3 bg-muted-3 rounded-none" />
                <div className="h-3 w-1/2 bg-muted-3 rounded-none" />
              </div>
            </div>
          ) : isGuest ? (
            <button
              type="button"
              className="flex items-center gap-sp-3 w-full min-h-touch text-left"
              onClick={() => { openGate('profile_nav'); onClose(); }}
            >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-3)' }}
              >
                <LogIn size={22} strokeWidth={2} className="text-lav" />
              </span>
              <span className="flex flex-col">
                <span className="text-f-base font-semibold text-lav">{t('signIn')}</span>
                <span className="text-f-sm text-muted">{t('guestSubtitle')}</span>
              </span>
            </button>
          ) : (
            <Link href="/profile" className="flex items-center gap-sp-3 min-h-touch" onClick={onClose}>
              <span
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-3)' }}
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <User size={22} strokeWidth={2} className="text-muted" />
                )}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-f-base font-semibold text-fg truncate">{profile?.name ?? ''}</span>
                <span className="text-f-sm text-muted truncate">{profile?.email ?? ''}</span>
              </span>
            </Link>
          )}
        </div>

        {/* Middle: menu */}
        <nav className="flex-1 overflow-y-auto py-sp-2" aria-label={t('mainNavigation')}>
          {gatedOrLink('/notifications', t('notifications'), <Bell size={22} strokeWidth={2} />, true)}
          {gatedOrLink('/profile/settings', t('settings'), <Settings size={22} strokeWidth={2} />)}

          {/* Language — inline locale switcher */}
          <button
            type="button"
            className={rowClass}
            onClick={() => setLangExpanded(v => !v)}
            aria-expanded={langExpanded}
          >
            <Globe size={22} strokeWidth={2} className="shrink-0" />
            <span className="flex-1 text-left">{t('language')}</span>
            <ChevronRight
              size={18}
              strokeWidth={2}
              className="shrink-0 transition-transform"
              style={{ transform: langExpanded ? 'rotate(90deg)' : 'none' }}
              aria-hidden="true"
            />
          </button>
          {langExpanded && (
            <div className="flex flex-col" style={{ background: 'var(--bg-3)' }}>
              {LOCALES.map(loc => (
                <button
                  key={loc}
                  type="button"
                  className="min-h-touch pl-[52px] pr-sp-4 text-left text-f-md text-muted hover:text-fg transition-colors"
                  onClick={() => changeLocale(loc)}
                >
                  {tProfile(`settings.languages.${loc}`)}
                </button>
              ))}
            </div>
          )}

          <Link href="/help" className={rowClass} onClick={onClose}>
            <HelpCircle size={22} strokeWidth={2} className="shrink-0" />
            <span className="flex-1">{t('help')}</span>
          </Link>

          {/* Legal — inline links */}
          <button
            type="button"
            className={rowClass}
            onClick={() => setLegalExpanded(v => !v)}
            aria-expanded={legalExpanded}
          >
            <FileText size={22} strokeWidth={2} className="shrink-0" />
            <span className="flex-1 text-left">{t('legal')}</span>
            <ChevronRight
              size={18}
              strokeWidth={2}
              className="shrink-0 transition-transform"
              style={{ transform: legalExpanded ? 'rotate(90deg)' : 'none' }}
              aria-hidden="true"
            />
          </button>
          {legalExpanded && (
            <div className="flex flex-col" style={{ background: 'var(--bg-3)' }}>
              {LEGAL_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="min-h-touch pl-[52px] pr-sp-4 flex items-center text-f-md text-muted hover:text-fg transition-colors"
                  onClick={onClose}
                >
                  {t(key)}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom: log out (logged-in only) */}
        {!isLoading && !isGuest && (
          <div className="p-sp-2 shrink-0" style={{ borderTop: 'var(--bdr)' }}>
            <button
              type="button"
              className="flex items-center gap-sp-3 w-full min-h-touch px-sp-4 text-f-base font-medium text-danger hover:bg-muted-3 transition-colors"
              onClick={async () => { onClose(); await createSupabaseBrowserClient().auth.signOut(); router.push('/'); }}
            >
              <LogOut size={22} strokeWidth={2} className="shrink-0" />
              <span className="flex-1 text-left">{t('signOut')}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
