'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { MAX_INTEREST_CHIPS, labelOf, type InterestCategory } from '@/lib/onboarding';

interface Props {
  categories: InterestCategory[];
  isLoading:  boolean;
  isError:    boolean;
  onRetry:    () => void;
  tags:       string[];
  onToggle:   (slug: string) => void;
}

export default function StepTaste({ categories, isLoading, isError, onRetry, tags, onToggle }: Props) {
  const t    = useTranslations('mapOnboarding.taste');
  const lang = useLocale();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [query, setQuery]           = useState('');

  const chipBySlug = useMemo(() => {
    const m = new Map<string, { slug: string; label: string }>();
    for (const cat of categories) for (const c of cat.chips) m.set(c.slug, { slug: c.slug, label: labelOf(c, lang) });
    return m;
  }, [categories, lang]);

  const active = categories.find(c => c.slug === activeSlug) ?? categories[0];
  const q = query.trim().toLowerCase();

  // 검색 중이면 카테고리 무관하게 전체 칩에서 로컬 필터 (labels[lang] 기준, 서버 호출 없음).
  const shown = q
    ? categories.flatMap(cat => cat.chips).filter(c => labelOf(c, lang).toLowerCase().includes(q))
    : (active?.chips ?? []);

  const full = tags.length >= MAX_INTEREST_CHIPS;

  if (isLoading) return <p className="text-f-base text-muted py-sp-8 text-center" role="status">{t('loading')}</p>;
  if (isError) {
    return (
      <div className="py-sp-8 text-center">
        <p className="text-f-base text-muted mb-sp-3">{t('error')}</p>
        <button type="button" onClick={onRetry} className="min-h-touch px-sp-4 border border-line text-f-sm text-fg hover:bg-muted-3 rounded-none">
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sp-3 min-h-0">
      <label className="flex items-center gap-sp-2 border border-line px-sp-3 min-h-touch rounded-none">
        <Search size={16} strokeWidth={2} className="shrink-0 opacity-50" aria-hidden="true" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="flex-1 min-w-0 bg-transparent text-f-base text-fg placeholder:text-muted outline-none"
        />
      </label>

      {/* 선택한 칩 누적 — 여기서 바로 해제 */}
      <div className="flex flex-wrap gap-sp-2 min-h-[36px]" aria-label={t('selected')}>
        {tags.length === 0 && <span className="text-f-sm text-muted self-center">{t('emptySelection')}</span>}
        {tags.map(slug => (
          <button
            key={slug}
            type="button"
            onClick={() => onToggle(slug)}
            aria-label={t('remove', { label: chipBySlug.get(slug)?.label ?? slug })}
            className="inline-flex items-center gap-sp-1 px-sp-3 min-h-[32px] bg-fg text-bg text-f-sm rounded-none"
          >
            {chipBySlug.get(slug)?.label ?? slug}
            <X size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="flex gap-sp-3 border-t border-line pt-sp-3 min-h-0">
        {!q && (
          <nav className="w-[112px] shrink-0 flex flex-col gap-[2px] overflow-y-auto max-h-[260px]" aria-label={t('categories')}>
            {categories.map(cat => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveSlug(cat.slug)}
                aria-current={cat.slug === active?.slug ? 'true' : undefined}
                className={[
                  'text-left text-f-sm px-sp-3 min-h-touch rounded-none transition-colors',
                  cat.slug === active?.slug ? 'bg-muted-3 text-fg font-medium' : 'text-muted hover:bg-muted-3',
                ].join(' ')}
              >
                {labelOf(cat, lang)}
              </button>
            ))}
          </nav>
        )}
        <div className="flex-1 min-w-0 flex flex-wrap gap-sp-2 content-start overflow-y-auto max-h-[260px]">
          {shown.length === 0 && <p className="text-f-sm text-muted py-sp-4">{t('noResults')}</p>}
          {shown.map(c => {
            const on = tags.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => onToggle(c.slug)}
                className={[
                  'px-sp-3 min-h-[36px] text-f-sm rounded-none border transition-colors',
                  on ? 'bg-muted-3 border-fg text-fg' : 'border-line text-fg hover:bg-muted-3',
                  !on && full ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {labelOf(c, lang)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
