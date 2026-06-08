'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Bell, Globe, HelpCircle, Menu, X, ChevronLeft } from 'lucide-react';

interface TopNavProps {
  onMobileMenuOpen: () => void;
  notifCount?: number;
}

export default function TopNav({ onMobileMenuOpen, notifCount = 0 }: TopNavProps) {
  const t = useTranslations('topNav');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [searchVal, setSearchVal] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 right-0 z-50 h-[52px] flex items-center gap-2.5 px-4 bg-bg-2 lg:left-[52px] left-0"
        style={{ borderBottom: 'var(--bdr)' }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden relative min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg shrink-0"
          onClick={onMobileMenuOpen}
          aria-label={tNav('menuOpen')}
        >
          <Menu size={20} strokeWidth={2} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-fg text-[9px] font-bold flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>

        {/* Desktop B4K label (hidden — sidebar shows the logo) */}

        {/* Search */}
        <div className="flex-1 max-w-[480px] mx-auto relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Search size={14} strokeWidth={2} />
          </div>
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => {
              if (window.innerWidth < 1024) setMobileSearchOpen(true);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full h-8 rounded-full pl-8 pr-8 text-[12px] text-fg placeholder:text-muted outline-none bg-bg-3"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('searchPlaceholder')}
          />
          {searchVal && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              onClick={() => setSearchVal('')}
              aria-label={t('clearSearch')}
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Actions (desktop) */}
        <div className="hidden lg:flex items-center gap-1 ml-auto shrink-0">
          <button
            className="relative min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('notifications')}
          >
            <Bell size={17} strokeWidth={2} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-fg text-[9px] font-bold flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>

          <button
            className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('language')}
          >
            <Globe size={17} strokeWidth={2} />
          </button>

          <button
            className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('help')}
          >
            <HelpCircle size={17} strokeWidth={2} />
          </button>

        </div>

        {/* Mobile action: search icon */}
        <div className="flex lg:hidden items-center gap-1 ml-auto shrink-0">
          <button
            className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted"
            onClick={() => setMobileSearchOpen(true)}
            aria-label={t('searchPlaceholder')}
          >
            <Search size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-bg z-[200] flex flex-col lg:hidden">
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: 'var(--bdr)' }}>
            <button
              className="text-muted p-1"
              onClick={() => setMobileSearchOpen(false)}
              aria-label={tCommon('back')}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <input
              autoFocus
              placeholder={t('searchPlaceholderMobile')}
              className="flex-1 h-9 rounded-full px-4 text-[14px] text-fg placeholder:text-muted outline-none bg-bg-3"
              style={{ border: '1px solid var(--bdr)' }}
            />
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted mb-3">
              {t('recentSearches')}
            </p>
            <p className="text-[12px] text-muted py-6 text-center">
              {t('noRecents')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
