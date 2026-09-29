'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toISODate } from '@/lib/onboarding';

export interface DateRange { start: string | null; end: string | null }

interface Props {
  value:    DateRange;
  onChange: (v: DateRange) => void;
}

// 의존성 없는 기간 선택 캘린더. 첫 클릭 = 시작일, 두 번째 클릭 = 종료일 (시작일보다 앞이면 시작일 재지정).
export default function RangeCalendar({ value, onChange }: Props) {
  const t      = useTranslations('mapOnboarding.calendar');
  const locale = useLocale();
  const today  = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(cursor);
  // 2024-01-07 은 일요일 — 로케일별 요일 약칭을 일~토 순으로 만든다.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i)));

  const first     = cursor.getDay();
  const daysInMon = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: daysInMon }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  function pick(d: Date) {
    const iso = toISODate(d);
    if (!value.start || value.end || iso < value.start) onChange({ start: iso, end: null });
    else onChange({ start: value.start, end: iso });
  }

  function step(delta: number) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-sp-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={isCurrentMonth}
          aria-label={t('prevMonth')}
          className="min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 disabled:opacity-20 rounded-none"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className="text-f-base font-medium text-fg">{monthLabel}</span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={t('nextMonth')}
          className="min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 rounded-none"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-f-xs text-muted mb-sp-1">
        {weekdays.map((w, i) => <span key={i} className="py-sp-1">{w}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-y-[2px]">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso      = toISODate(d);
          const past     = d < today;
          const isStart  = iso === value.start;
          const isEnd    = iso === value.end;
          const inRange  = !!value.start && !!value.end && iso > value.start && iso < value.end;
          const selected = isStart || isEnd;
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => pick(d)}
              aria-pressed={selected}
              aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(d)}
              className={[
                'h-9 text-f-sm rounded-none transition-colors',
                past ? 'text-muted-2 opacity-40 cursor-not-allowed' : 'hover:bg-muted-3',
                selected ? 'bg-fg text-bg font-semibold hover:bg-fg' : inRange ? 'bg-muted-3 text-fg' : 'text-fg',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
