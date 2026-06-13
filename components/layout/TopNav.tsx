'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Search, Bell, Globe, HelpCircle, Menu, X, ChevronLeft, ChevronRight, MapPin, Route, SearchX } from 'lucide-react';
import { getDisplayName } from '@/lib/display-name';

interface TopNavProps {
  onMobileMenuOpen: () => void;
  notifCount?: number;
}

const SEARCH_FILTERS = ['all', 'places', 'itineraries', 'kpop', 'kdrama', 'kbeauty'] as const;
type Filter = typeof SEARCH_FILTERS[number];

const LOCALE_LABELS: Record<string, string> = {
  en:      'English',
  ko:      '한국어',
  ja:      '日本語',
  'zh-CN': '中文(简)',
  'zh-TW': '中文(繁)',
  th:      'ภาษาไทย',
  'pt-BR': 'Português',
};

const STUB_RESULTS = [
  { id: 'r1', type: 'place' as const,     name_en: 'Gyeongbokgung Palace',   name_ko: '경복궁',        region: 'Jongno-gu, Seoul' },
  { id: 'r2', type: 'place' as const,     name_en: 'N Seoul Tower',           name_ko: 'N 서울타워',    region: 'Namsan, Seoul' },
  { id: 'r3', type: 'itinerary' as const, name_en: 'Seoul BTS Trail · 5 Stops', name_ko: 'Seoul BTS Trail · 5 Stops', region: '' },
  { id: 'r4', type: 'place' as const,     name_en: 'Haeundae Beach',          name_ko: '해운대 해수욕장', region: 'Busan' },
  { id: 'r5', type: 'place' as const,     name_en: 'Jeonju Hanok Village',    name_ko: '전주 한옥마을', region: 'Jeonju' },
];

export default function TopNav({ onMobileMenuOpen, notifCount = 0 }: TopNavProps) {
  const t       = useTranslations('topNav');
  const tNav    = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = useLocale();

  const [searchVal, setSearchVal]               = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter]         = useState<Filter>('all');
  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const [localeOpen, setLocaleOpen]             = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDropdownOpen(searchVal.length >= 2);
  }, [searchVal]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    function handleLocaleClickOutside(e: MouseEvent) {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousedown', handleLocaleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousedown', handleLocaleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filtered = STUB_RESULTS.filter(r => {
    const q = searchVal.toLowerCase();
    const matchesQuery = r.name_en.toLowerCase().includes(q) || r.name_ko.includes(q) || r.region.toLowerCase().includes(q);
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'places' && r.type === 'place')
      || (activeFilter === 'itineraries' && r.type === 'itinerary');
    return matchesQuery && matchesFilter;
  });

  const hasResults = filtered.length > 0;

  function handleResultClick() {
    setDropdownOpen(false);
    setSearchVal('');
    router.push('/map');
  }

  return (
    <>
      <header
        className="fixed top-0 right-0 z-50 h-[52px] flex items-center gap-2.5 bg-bg-2 lg:left-[52px] left-0"
        style={{ borderBottom: 'var(--bdr)' }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden relative min-w-touch min-h-touch ml-4 flex items-center justify-center rounded-lg text-muted hover:text-fg shrink-0"
          onClick={onMobileMenuOpen}
          aria-label={tNav('menuOpen')}
        >
          <Menu size={20} strokeWidth={2} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-fg text-f-xxs font-bold flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>

        {/* Search — desktop */}
        <div
          className="hidden lg:flex flex-1 max-w-[480px] relative"
          style={{ marginLeft: 'var(--sidebar)' }}
          ref={searchRef}
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-owns="search-listbox"
        >
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10">
            <Search size={14} strokeWidth={2} />
          </div>
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-8 rounded-full pl-8 pr-8 text-f-sm text-fg placeholder:text-muted outline-none bg-bg-3"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('searchPlaceholder')}
            aria-autocomplete="list"
            aria-controls="search-listbox"
          />
          {searchVal && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg z-10"
              onClick={() => { setSearchVal(''); setDropdownOpen(false); }}
              aria-label={t('clearSearch')}
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}

          {/* Search results dropdown */}
          {dropdownOpen && (
            <div
              id="search-listbox"
              className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-lg overflow-hidden"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)', maxHeight: 380, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              role="listbox"
              aria-label={t('searchPlaceholder')}
            >
              {/* Filter chips */}
              <div className="flex gap-1.5 px-sp-3 py-sp-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--bdr)' }}>
                {SEARCH_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={[
                      'shrink-0 px-3 h-[26px] rounded-full text-f-xs font-semibold transition-colors whitespace-nowrap',
                      activeFilter === f ? 'bg-lav text-bg' : 'bg-muted-3 text-muted hover:text-fg',
                    ].join(' ')}
                    aria-pressed={activeFilter === f}
                  >
                    {t(`searchFilters.${f}`)}
                  </button>
                ))}
              </div>

              {/* Results */}
              {hasResults ? (
                <ul>
                  {filtered.map(r => {
                    const name = getDisplayName({ name_en: r.name_en, name_ko: r.name_ko });
                    return (
                      <li key={r.id}>
                        <button
                          onClick={handleResultClick}
                          className="w-full flex items-center gap-sp-3 px-sp-3 py-sp-3 text-left hover:bg-muted-3 transition-colors"
                          aria-label={t('searchResultAriaLabel', { name, type: r.type })}
                          role="option"
                          aria-selected={false}
                        >
                          <span className="text-muted shrink-0" aria-hidden="true">
                            {r.type === 'itinerary'
                              ? <Route size={14} strokeWidth={2} />
                              : <MapPin size={14} strokeWidth={2} />
                            }
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-f-md text-fg truncate">{name}</span>
                            {r.region && <span className="block text-f-xs text-muted truncate">{r.region}</span>}
                          </span>
                          <ChevronRight size={12} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                /* ERR_05 — No results */
                <div className="flex flex-col items-center justify-center text-center py-10 px-6" role="status">
                  <SearchX size={32} strokeWidth={2} className="text-muted-2 mb-3" aria-hidden="true" />
                  <p className="text-f-md font-semibold text-fg mb-1">
                    {t('noResults', { query: searchVal })}
                  </p>
                  <p className="text-f-xs text-muted">{t('noResultsDesc')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (desktop) */}
        <div className="hidden lg:flex items-center gap-1 ml-auto mr-4 shrink-0">
          <Link
            href="/notifications"
            className="relative min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('notifications')}
          >
            <Bell size={17} strokeWidth={2} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-fg text-f-xxs font-bold flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </Link>

          {/* Locale switcher */}
          <div className="relative" ref={localeRef}>
            <button
              className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
              aria-label={tNav('language')}
              aria-expanded={localeOpen}
              aria-haspopup="listbox"
              onClick={() => setLocaleOpen(o => !o)}
            >
              <Globe size={17} strokeWidth={2} />
            </button>
            {localeOpen && (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-50 rounded-lg overflow-hidden min-w-[140px]"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                role="listbox"
                aria-label={tNav('language')}
              >
                {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
                  <button
                    key={loc}
                    role="option"
                    aria-selected={loc === locale}
                    className={[
                      'w-full text-left px-sp-3 py-sp-2 text-f-sm transition-colors',
                      loc === locale ? 'text-lav font-semibold' : 'text-muted hover:text-fg hover:bg-muted-3',
                    ].join(' ')}
                    onClick={() => { router.replace(pathname, { locale: loc }); setLocaleOpen(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/help"
            className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('help')}
          >
            <HelpCircle size={17} strokeWidth={2} />
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-1 ml-auto mr-4 shrink-0">
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
              onClick={() => { setMobileSearchOpen(false); setSearchVal(''); }}
              aria-label={tCommon('back')}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <input
              autoFocus
              type="search"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder={t('searchPlaceholderMobile')}
              className="flex-1 h-9 rounded-full px-4 text-f-base text-fg placeholder:text-muted outline-none bg-bg-3"
              style={{ border: '1px solid var(--bdr)' }}
              aria-label={t('searchPlaceholderMobile')}
            />
            {searchVal && (
              <button onClick={() => setSearchVal('')} className="text-muted" aria-label={t('clearSearch')}>
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {searchVal.length >= 2 ? (
            <div className="flex-1 overflow-y-auto">
              {/* Filter chips */}
              <div className="flex gap-1.5 px-4 py-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--bdr)' }}>
                {SEARCH_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={[
                      'shrink-0 px-3 h-[28px] rounded-full text-f-sm font-semibold transition-colors whitespace-nowrap',
                      activeFilter === f ? 'bg-lav text-bg' : 'bg-muted-3 text-muted',
                    ].join(' ')}
                    aria-pressed={activeFilter === f}
                  >
                    {t(`searchFilters.${f}`)}
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? (
                <ul>
                  {filtered.map(r => {
                    const name = getDisplayName({ name_en: r.name_en, name_ko: r.name_ko });
                    return (
                      <li key={r.id}>
                        <button
                          onClick={() => { setMobileSearchOpen(false); setSearchVal(''); router.push('/map'); }}
                          className="w-full flex items-center gap-sp-3 px-4 py-sp-4 text-left"
                          style={{ borderBottom: '1px solid var(--bdr)' }}
                          aria-label={t('searchResultAriaLabel', { name, type: r.type })}
                        >
                          <span className="text-muted shrink-0" aria-hidden="true">
                            {r.type === 'itinerary' ? <Route size={16} strokeWidth={2} /> : <MapPin size={16} strokeWidth={2} />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-f-base text-fg truncate">{name}</span>
                            {r.region && <span className="block text-f-sm text-muted">{r.region}</span>}
                          </span>
                          <ChevronRight size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6" role="status">
                  <SearchX size={40} strokeWidth={2} className="text-muted-2 mb-3" aria-hidden="true" />
                  <p className="text-f-lg font-semibold text-fg mb-1">{t('noResults', { query: searchVal })}</p>
                  <p className="text-f-md text-muted">{t('noResultsDesc')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-f-xs font-semibold tracking-[0.06em] uppercase text-muted mb-3">
                {t('recentSearches')}
              </p>
              <p className="text-f-sm text-muted py-6 text-center">{t('noRecents')}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
