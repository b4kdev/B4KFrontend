'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { Search, Globe, HelpCircle, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  onMobileMenuOpen: () => void;
}

// ─── localStorage recents helpers ─────────────────────────────────────────────

const RECENTS_KEY = 'b4k_search_recents';
const MAX_RECENTS = 5;
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface RecentItem {
  query: string;
  ts: number;
}

function getRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const items: RecentItem[] = JSON.parse(raw);
    const now = Date.now();
    return items.filter(i => now - i.ts < EXPIRY_MS).map(i => i.query);
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const existing = getRecents();
    const filtered = existing.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(
      updated.map(q => ({ query: q, ts: Date.now() }))
    ));
  } catch { /* ignore */ }
}

function removeRecent(query: string) {
  try {
    const updated = getRecents().filter(q => q !== query);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(
      updated.map(q => ({ query: q, ts: Date.now() }))
    ));
  } catch { /* ignore */ }
}

function clearRecents() {
  try { localStorage.removeItem(RECENTS_KEY); } catch { /* ignore */ }
}

// ─── Locale label map ─────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, string> = {
  en:      'English',
  ko:      '한국어',
  ja:      '日本語',
  'zh-CN': '中文(简)',
  'zh-TW': '中文(繁)',
  th:      'ภาษาไทย',
  'pt-BR': 'Português',
};

// ─── Category chips (always shown in empty/short state) ───────────────────────

const CATEGORY_CHIPS = [
  { key: 'kpop',    query: 'k-pop' },
  { key: 'kdrama',  query: 'k-drama' },
  { key: 'kbeauty', query: 'k-beauty' },
  { key: 'kculture',query: 'k-culture' },
] as const;

// ─── SearchDropdown ───────────────────────────────────────────────────────────

interface SearchDropdownProps {
  searchVal: string;
  recents: string[];
  onRecentClick: (q: string) => void;
  onRecentRemove: (q: string) => void;
  onClearAll: () => void;
  onCategoryChip: (query: string) => void;
  highlightIdx: number;
  dropdownId: string;
}

function SearchDropdown({
  searchVal,
  recents,
  onRecentClick,
  onRecentRemove,
  onClearAll,
  onCategoryChip,
  highlightIdx,
  dropdownId,
}: SearchDropdownProps) {
  const t = useTranslations('search');
  const tNav = useTranslations('topNav');

  // Debounced query for suggestions
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    if (searchVal.trim().length < 2) { setDebouncedQ(''); return; }
    const id = setTimeout(() => setDebouncedQ(searchVal.trim()), 300);
    return () => clearTimeout(id);
  }, [searchVal]);

  const { data, isLoading } = useSWR<{ suggestions: string[] }>(
    debouncedQ ? `/api/search/suggestions?q=${encodeURIComponent(debouncedQ)}` : null,
    fetcher,
  );
  const suggestions = data?.suggestions ?? [];
  const showSuggestions = searchVal.trim().length >= 2;

  return (
    <div
      id={dropdownId}
      role="listbox"
      aria-label={t('placeholder')}
      className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 overflow-hidden"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--bdr)',
        maxHeight: 400,
        overflowY: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      {!showSuggestions ? (
        /* Empty state: recents + category chips */
        <>
          {recents.length > 0 && (
            <div>
              <div
                className="flex items-center justify-between px-sp-3 py-sp-2"
                style={{ borderBottom: '1px solid var(--bdr)' }}
              >
                <p className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {t('recentTitle')}
                </p>
                <button
                  onClick={onClearAll}
                  className="text-f-xs text-lav hover:text-fg transition-colors min-h-touch flex items-center px-sp-2"
                >
                  {t('clearAll')}
                </button>
              </div>
              <ul>
                {recents.map((q, idx) => (
                  <li key={q} role="option" aria-selected={idx === highlightIdx}>
                    <div
                      className="flex items-center gap-sp-3 px-sp-3 hover:bg-muted-3 transition-colors"
                      style={{ background: idx === highlightIdx ? 'var(--muted-3)' : undefined }}
                    >
                      <button
                        className="flex-1 flex items-center gap-sp-3 py-sp-2 text-left min-h-touch"
                        onClick={() => onRecentClick(q)}
                      >
                        <Search size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                        <span className="text-f-sm text-fg truncate">{q}</span>
                      </button>
                      <button
                        className="text-muted hover:text-fg shrink-0 min-h-touch min-w-[32px] flex items-center justify-center"
                        onClick={() => onRecentRemove(q)}
                        aria-label={t('removeRecent', { query: q })}
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="flex flex-wrap gap-sp-2 px-sp-3 py-sp-3"
            style={{ borderTop: recents.length > 0 ? '1px solid var(--bdr)' : undefined }}
          >
            {CATEGORY_CHIPS.map(chip => (
              <button
                key={chip.key}
                onClick={() => onCategoryChip(chip.query)}
                className="px-sp-3 py-sp-1 rounded-full text-f-xs font-semibold text-lav min-h-touch flex items-center transition-colors hover:bg-lav-dim"
                style={{ border: '1px solid var(--lav-border)' }}
              >
                {t(`categories.${chip.key}`)}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Typing state: suggestions */
        <>
          {isLoading ? (
            <ul aria-label="Loading suggestions">
              {[0, 1, 2].map(i => (
                <li key={i} className="flex items-center gap-sp-3 px-sp-3 py-sp-3 animate-pulse">
                  <div className="w-3.5 h-3.5 rounded-none shrink-0" style={{ background: 'var(--muted-3)' }} />
                  <div className="flex-1 h-3 rounded-none" style={{ background: 'var(--muted-3)', width: '60%' }} />
                </li>
              ))}
            </ul>
          ) : suggestions.length === 0 ? (
            <div className="py-sp-4 px-sp-3 text-center">
              <p className="text-f-sm text-muted">{tNav('noResults', { query: searchVal })}</p>
            </div>
          ) : (
            <ul>
              {suggestions.map((s, idx) => (
                <li key={s} role="option" aria-selected={idx === highlightIdx}>
                  <button
                    className="w-full flex items-center gap-sp-3 px-sp-3 py-sp-2 text-left min-h-touch hover:bg-muted-3 transition-colors"
                    style={{ background: idx === highlightIdx ? 'var(--muted-3)' : undefined }}
                    onClick={() => onRecentClick(s)}
                  >
                    <Search size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-f-sm text-fg truncate">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main TopNav ──────────────────────────────────────────────────────────────

export default function TopNav({ onMobileMenuOpen }: TopNavProps) {
  const t       = useTranslations('topNav');
  const tSearch = useTranslations('search');
  const tNav    = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { data: unreadData } = useSWR<{ count: number }>(
    '/api/notifications/unread-count', fetcher, { refreshInterval: 60_000 },
  );
  const notifCount = unreadData?.count ?? 0;
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = useLocale();

  const [searchVal, setSearchVal]               = useState('');
  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localeOpen, setLocaleOpen]             = useState(false);
  const [recents, setRecents]                   = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx]         = useState(-1);

  const searchRef  = useRef<HTMLDivElement>(null);
  const localeRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const mInputRef  = useRef<HTMLInputElement>(null);

  // Load recents from localStorage (client-only)
  useEffect(() => {
    setRecents(getRecents());
  }, []);

  // Route change → close dropdown
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // Outside-click + Escape handler
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setLocaleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Navigate to /search, save recent
  const navigateSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    saveRecent(query.trim());
    setRecents(getRecents());
    setDropdownOpen(false);
    setSearchVal('');
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [router]);

  // Submit handler
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    navigateSearch(searchVal);
  }, [searchVal, navigateSearch]);

  // Handle keyboard navigation in dropdown
  const handleKeyDownInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = searchVal.trim().length < 2 ? recents : []; // suggestion length unknown at this level, treated by sub
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < items.length) {
        navigateSearch(items[highlightIdx]);
      } else {
        handleSubmit();
      }
    }
  }, [searchVal, recents, highlightIdx, navigateSearch, handleSubmit]);

  const handleRecentRemove = useCallback((q: string) => {
    removeRecent(q);
    setRecents(getRecents());
  }, []);

  const handleClearAll = useCallback(() => {
    clearRecents();
    setRecents([]);
  }, []);

  const handleCategoryChip = useCallback((query: string) => {
    navigateSearch(query);
  }, [navigateSearch]);

  return (
    <>
      <header
        className="fixed top-0 right-0 z-50 h-[50px] flex items-center gap-2.5 bg-bg-2 lg:left-[50px] left-0"
        style={{ borderBottom: 'var(--bdr)' }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden relative min-w-touch min-h-touch ml-4 flex items-center justify-center rounded-full text-muted hover:text-fg shrink-0"
          onClick={onMobileMenuOpen}
          aria-label={tNav('menuOpen')}
        >
          <Menu size={24} strokeWidth={2} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-fg text-f-xxs font-bold flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>

        {/* Search — desktop */}
        <div
          className="hidden lg:flex flex-1 max-w-[480px] relative ml-sp-4"
          ref={searchRef}
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-owns="search-listbox"
        >
          <form onSubmit={handleSubmit} className="w-full relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" aria-hidden="true">
              <Search size={14} strokeWidth={2} />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); setHighlightIdx(-1); }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={handleKeyDownInput}
              placeholder={tSearch('placeholder')}
              className="w-full h-8 rounded-full pl-8 pr-8 text-f-sm text-fg placeholder:text-muted outline-none bg-bg-3"
              style={{ border: '1px solid var(--bdr)' }}
              aria-label={tSearch('placeholder')}
              aria-autocomplete="list"
              aria-controls="search-listbox"
            />
            {searchVal && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg z-10"
                onClick={() => { setSearchVal(''); setDropdownOpen(true); inputRef.current?.focus(); }}
                aria-label={t('clearSearch')}
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </form>

          {dropdownOpen && (
            <SearchDropdown
              dropdownId="search-listbox"
              searchVal={searchVal}
              recents={recents}
              onRecentClick={navigateSearch}
              onRecentRemove={handleRecentRemove}
              onClearAll={handleClearAll}
              onCategoryChip={handleCategoryChip}
              highlightIdx={highlightIdx}
            />
          )}
        </div>

        {/* Actions (desktop) */}
        <div className="hidden lg:flex items-center gap-1 ml-auto mr-4 shrink-0">
          {/* Locale switcher */}
          <div className="relative" ref={localeRef}>
            <button
              className="min-w-touch min-h-touch flex items-center justify-center rounded-full text-muted hover:text-fg hover:bg-muted-3 transition-colors"
              aria-label={tNav('language')}
              aria-expanded={localeOpen}
              aria-haspopup="listbox"
              onClick={() => setLocaleOpen(o => !o)}
            >
              <Globe size={24} strokeWidth={2} />
            </button>
            {localeOpen && (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-50 overflow-hidden min-w-[140px]"
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
            className="min-w-touch min-h-touch flex items-center justify-center rounded-full text-muted hover:text-fg hover:bg-muted-3 transition-colors"
            aria-label={tNav('help')}
          >
            <HelpCircle size={24} strokeWidth={2} />
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-1 ml-auto mr-4 shrink-0">
          <button
            className="min-w-touch min-h-touch flex items-center justify-center rounded-full text-muted"
            onClick={() => { setMobileSearchOpen(true); setRecents(getRecents()); }}
            aria-label={tSearch('placeholder')}
          >
            <Search size={24} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <MobileSearchOverlay
          onClose={() => { setMobileSearchOpen(false); setSearchVal(''); }}
          navigateSearch={(q) => { setMobileSearchOpen(false); navigateSearch(q); }}
        />
      )}
    </>
  );
}

// ─── Mobile Search Overlay ────────────────────────────────────────────────────

function MobileSearchOverlay({
  onClose,
  navigateSearch,
}: {
  onClose: () => void;
  navigateSearch: (q: string) => void;
}) {
  const t       = useTranslations('search');
  const tSearch = useTranslations('topNav');
  const tCommon = useTranslations('common');

  const [searchVal, setSearchVal]   = useState('');
  const [recents, setRecents]       = useState<string[]>(getRecents);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced query
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    if (searchVal.trim().length < 2) { setDebouncedQ(''); return; }
    const id = setTimeout(() => setDebouncedQ(searchVal.trim()), 300);
    return () => clearTimeout(id);
  }, [searchVal]);

  const { data, isLoading } = useSWR<{ suggestions: string[] }>(
    debouncedQ ? `/api/search/suggestions?q=${encodeURIComponent(debouncedQ)}` : null,
    fetcher,
  );
  const suggestions = data?.suggestions ?? [];
  const showSuggestions = searchVal.trim().length >= 2;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchVal.trim()) return;
    navigateSearch(searchVal.trim());
  };

  const handleSelect = (q: string) => {
    navigateSearch(q);
  };

  const handleRecentRemove = (q: string) => {
    removeRecent(q);
    setRecents(getRecents());
  };

  const handleClearAll = () => {
    clearRecents();
    setRecents([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = showSuggestions ? suggestions : recents;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < items.length) {
        handleSelect(items[highlightIdx]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-bg z-[200] flex flex-col lg:hidden" role="dialog" aria-modal="true" aria-label={t('placeholder')}>
      {/* Header */}
      <div className="flex items-center gap-sp-2 px-sp-3 py-sp-2" style={{ borderBottom: 'var(--bdr)' }}>
        <button
          className="text-muted min-h-touch min-w-touch flex items-center justify-center rounded-full"
          onClick={onClose}
          aria-label={tCommon('back')}
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setHighlightIdx(-1); }}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            className="w-full h-9 rounded-full px-sp-4 text-f-base text-fg placeholder:text-muted outline-none bg-bg-3"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('placeholder')}
          />
        </form>
        {searchVal && (
          <button
            onClick={() => { setSearchVal(''); inputRef.current?.focus(); }}
            className="text-muted min-h-touch min-w-touch flex items-center justify-center rounded-full"
            aria-label={tSearch('clearSearch')}
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!showSuggestions ? (
          /* Empty state: recents + chips */
          <>
            {recents.length > 0 && (
              <>
                <div
                  className="flex items-center justify-between px-sp-4 py-sp-2"
                  style={{ borderBottom: '1px solid var(--bdr)' }}
                >
                  <p className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {t('recentTitle')}
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="text-f-xs text-lav min-h-touch flex items-center px-sp-2"
                  >
                    {t('clearAll')}
                  </button>
                </div>
                <ul>
                  {recents.map((q, idx) => (
                    <li key={q}>
                      <div
                        className="flex items-center gap-sp-3 px-sp-4"
                        style={{
                          borderBottom: '1px solid var(--bdr)',
                          background: idx === highlightIdx ? 'var(--muted-3)' : undefined,
                        }}
                      >
                        <button
                          className="flex-1 flex items-center gap-sp-3 py-sp-3 text-left min-h-touch"
                          onClick={() => handleSelect(q)}
                        >
                          <Search size={16} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                          <span className="text-f-base text-fg truncate">{q}</span>
                        </button>
                        <button
                          className="text-muted shrink-0 min-h-touch min-w-touch flex items-center justify-center"
                          onClick={() => handleRecentRemove(q)}
                          aria-label={t('removeRecent', { query: q })}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Category chips */}
            <div className="flex flex-wrap gap-sp-2 px-sp-4 py-sp-4">
              {CATEGORY_CHIPS.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => navigateSearch(chip.query)}
                  className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold text-lav min-h-touch flex items-center"
                  style={{ border: '1px solid var(--lav-border)' }}
                >
                  {t(`categories.${chip.key}`)}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Typing state: suggestions */
          <>
            {isLoading ? (
              <ul>
                {[0, 1, 2].map(i => (
                  <li key={i} className="flex items-center gap-sp-3 px-sp-4 py-sp-3 animate-pulse" style={{ borderBottom: '1px solid var(--bdr)' }}>
                    <div className="w-4 h-4 rounded-none shrink-0" style={{ background: 'var(--muted-3)' }} />
                    <div className="flex-1 h-3 rounded-none" style={{ background: 'var(--muted-3)', width: '60%' }} />
                  </li>
                ))}
              </ul>
            ) : suggestions.length === 0 ? (
              <div className="py-sp-8 px-sp-4 text-center">
                <p className="text-f-base text-muted">{tSearch('noResults', { query: searchVal })}</p>
              </div>
            ) : (
              <ul>
                {suggestions.map((s, idx) => (
                  <li key={s}>
                    <button
                      className="w-full flex items-center gap-sp-3 px-sp-4 py-sp-3 text-left min-h-touch"
                      style={{
                        borderBottom: '1px solid var(--bdr)',
                        background: idx === highlightIdx ? 'var(--muted-3)' : undefined,
                      }}
                      onClick={() => handleSelect(s)}
                    >
                      <Search size={16} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                      <span className="flex-1 text-f-base text-fg truncate">{s}</span>
                      <ChevronRight size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
