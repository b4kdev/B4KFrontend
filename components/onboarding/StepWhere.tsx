'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Check } from 'lucide-react';
import { COMPANIONS, ONBOARDING_CITIES, type Companion, type OnboardingCity } from '@/lib/onboarding';
import RangeCalendar, { type DateRange } from './RangeCalendar';

interface Props {
  city:        OnboardingCity | null;
  range:       DateRange;
  companion:   Companion | null;
  onCity:      (c: OnboardingCity) => void;
  onRange:     (r: DateRange) => void;
  onCompanion: (c: Companion | null) => void;
}

const chipClass = (on: boolean) => [
  'min-h-touch px-sp-4 text-f-sm rounded-none border transition-colors',
  on ? 'bg-fg text-bg border-fg' : 'text-fg border-line hover:bg-muted-3',
].join(' ');

export default function StepWhere({ city, range, companion, onCity, onRange, onCompanion }: Props) {
  const t = useTranslations('mapOnboarding');
  const [query, setQuery] = useState('');

  // 도시명은 로케일별 messages 에 있으므로 번역된 이름 기준으로 필터한다.
  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ONBOARDING_CITIES.filter(c => !q || t(`cities.${c}`).toLowerCase().includes(q) || c.toLowerCase().includes(q));
  }, [query, t]);

  return (
    <div className="flex flex-col lg:flex-row gap-sp-6 min-h-0">
      {/* 어디 */}
      <section className="flex-1 min-w-0 flex flex-col gap-sp-3" aria-labelledby="onb-where">
        <h4 id="onb-where" className="text-f-sm text-muted">{t('where.label')}</h4>
        <label className="flex items-center gap-sp-2 border border-line px-sp-3 min-h-touch rounded-none">
          <Search size={16} strokeWidth={2} className="shrink-0 opacity-50" aria-hidden="true" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('where.searchPlaceholder')}
            aria-label={t('where.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent text-f-base text-fg placeholder:text-muted outline-none"
          />
        </label>
        {cities.length === 0 ? (
          <p className="text-f-sm text-muted py-sp-4">{t('where.noResults')}</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-sp-2 overflow-y-auto max-h-[300px] content-start">
            {cities.map(c => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => onCity(c)}
                  aria-pressed={city === c}
                  className={`${chipClass(city === c)} w-full flex items-center justify-between gap-sp-2`}
                >
                  <span className="truncate">{t(`cities.${c}`)}</span>
                  {city === c && <Check size={14} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 언제 · 누구와 */}
      <div className="lg:w-[280px] shrink-0 flex flex-col gap-sp-5">
        <section aria-labelledby="onb-when">
          <div className="flex items-center justify-between mb-sp-2">
            <h4 id="onb-when" className="text-f-sm text-muted">{t('when.label')}</h4>
            {(range.start || range.end) && (
              <button type="button" onClick={() => onRange({ start: null, end: null })} className="text-f-xs text-muted hover:text-fg">
                {t('when.clear')}
              </button>
            )}
          </div>
          <RangeCalendar value={range} onChange={onRange} />
          <p className="text-f-xs text-muted mt-sp-2">{t('when.hint')}</p>
        </section>

        <section aria-labelledby="onb-who">
          <h4 id="onb-who" className="text-f-sm text-muted mb-sp-2">{t('who.label')}</h4>
          <div className="flex flex-wrap gap-sp-2">
            {COMPANIONS.map(c => (
              <button
                key={c}
                type="button"
                aria-pressed={companion === c}
                onClick={() => onCompanion(companion === c ? null : c)}
                className={chipClass(companion === c)}
              >
                {t(`who.${c}`)}
              </button>
            ))}
          </div>
          <p className="text-f-xs text-muted mt-sp-2">{t('who.hint')}</p>
        </section>
      </div>
    </div>
  );
}
