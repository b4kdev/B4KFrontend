'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Companion, OnboardingCity } from '@/lib/onboarding';
import type { DateRange } from './RangeCalendar';

interface Props {
  city:       OnboardingCity | null;
  range:      DateRange;
  companion:  Companion | null;
  tagLabels:  string[];
  onEdit:     (step: 1 | 2) => void;
}

export default function StepConfirm({ city, range, companion, tagLabels, onEdit }: Props) {
  const t      = useTranslations('mapOnboarding');
  const locale = useLocale();
  const fmt    = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${iso}T00:00:00`));

  const when = range.start
    ? range.end && range.end !== range.start ? `${fmt(range.start)} – ${fmt(range.end)}` : fmt(range.start)
    : t('confirm.unset');

  const Row = ({ k, step, children }: { k: string; step: 1 | 2; children: React.ReactNode }) => (
    <div className="flex items-start gap-sp-3 px-sp-4 py-sp-3 border-b border-line last:border-b-0">
      <span className="w-[64px] shrink-0 text-f-sm text-muted pt-[2px]">{k}</span>
      <div className="flex-1 min-w-0 text-f-base text-fg">{children}</div>
      <button type="button" onClick={() => onEdit(step)} className="shrink-0 text-f-sm text-muted hover:text-fg min-h-touch flex items-center">
        {t('confirm.edit')}
      </button>
    </div>
  );

  return (
    <div className="border border-line rounded-none">
      <Row k={t('confirm.region')} step={1}>{city ? t(`cities.${city}`) : t('confirm.unset')}</Row>
      <Row k={t('confirm.period')} step={1}>{when}</Row>
      <Row k={t('confirm.companion')} step={1}>{companion ? t(`who.${companion}`) : t('confirm.unset')}</Row>
      <Row k={t('confirm.taste', { count: tagLabels.length })} step={2}>
        {tagLabels.length === 0 ? (
          <span className="text-muted">{t('confirm.unset')}</span>
        ) : (
          <div className="flex flex-wrap gap-sp-2">
            {tagLabels.map(l => <span key={l} className="px-sp-3 py-[2px] bg-muted-3 text-f-sm rounded-none">{l}</span>)}
          </div>
        )}
      </Row>
    </div>
  );
}
