'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { MAX_INTEREST_CHIPS, labelOf, type InterestCategory } from '@/lib/quickplan';

interface Props {
  categories: InterestCategory[];
  isLoading:  boolean;
  isError:    boolean;
  onRetry:    () => void;
  tags:       string[];
  onToggle:   (slug: string) => void;
  /** 하나도 안 고르고 "다음" 을 눌렀을 때 — "아직 고른 취향이 없어요" 를 빨간색으로 */
  error?:     boolean;
}

export default function StepTaste({ categories, isLoading, isError, onRetry, tags, onToggle, error }: Props) {
  const t    = useTranslations('quickPlan.taste');
  const lang = useLocale();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [overLimit, setOverLimit]   = useState(false);

  const chipBySlug = useMemo(() => {
    const m = new Map<string, { slug: string; label: string }>();
    for (const cat of categories) for (const c of cat.chips) m.set(c.slug, { slug: c.slug, label: labelOf(c, lang) });
    return m;
  }, [categories, lang]);

  const active = categories.find(c => c.slug === activeSlug) ?? categories[0];
  const shown  = active?.chips ?? [];

  // 이미 최대 개수인데 더 고르려 하면 빨간 안내 — 하나라도 해제하면 사라진다.
  const full = tags.length >= MAX_INTEREST_CHIPS;
  function pick(slug: string, on: boolean) {
    if (!on && full) { setOverLimit(true); return; }
    setOverLimit(false);
    onToggle(slug);
  }

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
    <div className="h-full flex flex-col gap-sp-3 min-h-0">
      {/* 선택한 칩 누적 — 여기서 바로 해제 */}
      <div className="flex flex-wrap gap-sp-2 min-h-[36px]" aria-label={t('selected')}>
        {tags.length === 0 && <span className={`text-f-sm self-center ${error ? 'text-danger font-medium' : 'text-muted'}`}>{t('emptySelection')}</span>}
        {tags.map(slug => (
          <button
            key={slug}
            type="button"
            onClick={() => pick(slug, true)}
            aria-label={t('remove', { label: chipBySlug.get(slug)?.label ?? slug })}
            className="inline-flex items-center gap-sp-1 px-sp-3 min-h-[32px] bg-fg text-bg text-f-sm rounded-none"
          >
            {chipBySlug.get(slug)?.label ?? slug}
            <X size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-sp-3 border-t border-line pt-sp-3 min-h-0">
        {/* 카테고리(왼쪽) — 항목들이 남는 높이를 균등 분할. 항목이 늘어 25px 아래로 내려가야 하면 그때부터 스크롤(바 숨김) */}
        <nav className="w-[136px] shrink-0 flex flex-col gap-[2px] overflow-y-auto scrollbar-hide" aria-label={t('categories')}>
          {categories.map(cat => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveSlug(cat.slug)}
              aria-current={cat.slug === active?.slug ? 'true' : undefined}
              className={[
                'flex-1 min-h-[25px] max-h-touch text-left text-f-sm px-sp-3 whitespace-nowrap rounded-none transition-colors',
                cat.slug === active?.slug ? 'bg-muted-3 text-fg font-medium' : 'text-muted hover:bg-muted-3',
              ].join(' ')}
            >
              {labelOf(cat, lang)}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-sp-3">
          <div className="flex-1 min-h-0 flex flex-wrap gap-sp-2 content-start overflow-y-auto scrollbar-hide">
            {shown.map(c => {
              const on = tags.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(c.slug, on)}
                  className={[
                    'px-sp-3 min-h-[36px] text-f-sm rounded-none border transition-colors',
                    on ? 'bg-muted-3 border-fg text-fg' : 'border-line text-fg hover:bg-muted-3',
                  ].join(' ')}
                >
                  {labelOf(c, lang)}
                </button>
              );
            })}
          </div>
          {overLimit && full && (
            <p className="shrink-0 text-f-sm text-danger font-medium" role="alert">{t('maxReached', { max: MAX_INTEREST_CHIPS })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
