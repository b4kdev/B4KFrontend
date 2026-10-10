'use client'

import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { MAX_PLAN_DAYS, planDayColor } from '@/lib/plan-day-colors'

interface Props {
  dayCount:    number
  activeDay:   number               // 0 = 전체
  onDayChange: (day: number) => void
  onAddDay:    () => void
  onRemoveDay: (day: number) => void
}

// 플랜 일차 탭 — [전체] [1일차] [2일차] … [+]. 데스크톱 "내 플랜" 패널과 모바일 플랜 시트가 같이 쓴다.
// 점 색 = 그 일차의 지도 경로·핀 색. 선택된 일차 탭에는 삭제(X)가 붙는다(일차가 하나뿐이면 없음).
export default function PlanDayTabs({ dayCount, activeDay, onDayChange, onAddDay, onRemoveDay }: Props) {
  const t = useTranslations('map.plan')
  const tabClass = 'min-h-touch px-sp-3 rounded-full text-f-xxs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5'
  const tabStyle = (on: boolean) => on ? { background: 'var(--muted-3)', color: 'var(--fg)' } : { color: 'var(--muted)' }

  return (
    <>
      <button onClick={() => onDayChange(0)} aria-pressed={activeDay === 0} className={tabClass} style={tabStyle(activeDay === 0)}>
        {t('allDays')}
      </button>
      {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => {
        const on = day === activeDay
        return (
          <div key={day} className="flex items-center shrink-0 rounded-full" style={tabStyle(on)}>
            <button onClick={() => onDayChange(day)} aria-pressed={on} className={`${tabClass} ${on && dayCount > 1 ? 'pr-1' : ''}`}>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: planDayColor(day) }}
                aria-hidden="true"
              />
              {t('dayTab', { n: day })}
            </button>
            {on && dayCount > 1 && (
              <button
                onClick={() => onRemoveDay(day)}
                aria-label={t('removeDay', { n: day })}
                title={t('removeDay', { n: day })}
                className="min-w-[28px] min-h-touch pr-1.5 flex items-center justify-center text-muted hover:text-danger transition-colors"
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}
      {dayCount < MAX_PLAN_DAYS && (
        <button
          onClick={onAddDay}
          aria-label={t('addDay')}
          title={t('addDay')}
          className="min-w-touch min-h-touch shrink-0 flex items-center justify-center rounded-full text-muted hover:text-fg hover:bg-muted-3 transition-colors"
        >
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </>
  )
}
