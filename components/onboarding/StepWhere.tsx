'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { COMPANIONS, ONBOARDING_CITIES, type Companion, type OnboardingCity } from '@/lib/onboarding';
import RangeCalendar, { type DateRange } from './RangeCalendar';

interface Props {
  city:        OnboardingCity | null;
  range:       DateRange;
  companion:   Companion | null;
  onCity:      (c: OnboardingCity) => void;
  onRange:     (r: DateRange) => void;
  onCompanion: (c: Companion | null) => void;
  /** "다음" 을 눌렀을 때 빠진 항목 — true 인 섹션 라벨을 빨간색으로 표시 */
  errors?:     { city: boolean; range: boolean; companion: boolean };
}

const chipClass = (on: boolean, size = 'min-h-touch px-sp-4') => [
  `${size} text-f-sm rounded-none border transition-colors`,
  on ? 'bg-fg text-bg border-fg' : 'text-fg border-line hover:bg-muted-3',
].join(' ');

const labelClass = (err?: boolean) => `text-f-sm ${err ? 'text-danger font-medium' : 'text-muted'}`;

export default function StepWhere({ city, range, companion, onCity, onRange, onCompanion, errors }: Props) {
  const t = useTranslations('mapOnboarding');

  return (
    <div className="flex flex-col lg:flex-row gap-sp-6 min-h-0">
      {/* 어디 */}
      <section className="flex-1 min-w-0 flex flex-col gap-sp-3" aria-labelledby="onb-where">
        <h4 id="onb-where" className={labelClass(errors?.city)}>{t('where.label')}</h4>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-[6px] content-start">
          {ONBOARDING_CITIES.map(c => (
            <li key={c}>
              <button
                type="button"
                onClick={() => onCity(c)}
                aria-pressed={city === c}
                className={`${chipClass(city === c, 'min-h-[40px] px-sp-3')} w-full flex items-center justify-between gap-sp-2`}
              >
                <span className="truncate">{t(`cities.${c}`)}</span>
                {city === c && <Check size={14} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 언제 · 누구와 */}
      <div className="lg:w-[280px] shrink-0 flex flex-col gap-sp-5">
        <section aria-labelledby="onb-when">
          <div className="flex items-center justify-between mb-sp-2">
            <h4 id="onb-when" className={labelClass(errors?.range)}>{t('when.label')}</h4>
            {(range.start || range.end) && (
              <button type="button" onClick={() => onRange({ start: null, end: null })} className="text-f-xs text-muted hover:text-fg">
                {t('when.clear')}
              </button>
            )}
          </div>
          <RangeCalendar value={range} onChange={onRange} />
        </section>

        <section aria-labelledby="onb-who">
          <h4 id="onb-who" className={`${labelClass(errors?.companion)} mb-sp-2`}>{t('who.label')}</h4>
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
        </section>
      </div>
    </div>
  );
}
