'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CalendarDay } from './Content'
import { IconButton } from './IconButton'

// Date range picker (live RangeCalendar in Quick plan): one month at a time, 280 wide,
// previous / next month (previous disabled on the current month), weekday row, 7-column grid of
// Calendar day; past days disabled. First tap sets Start, second End. Clear resets.
// Month and weekday names come from Intl in the page locale; weeks start on Sunday in all five.

export type DateRange = { start: Date | null; end: Date | null }

export type DateRangePickerProps = {
  value: DateRange
  onValueChange: (r: DateRange) => void
  previousLabel: string
  nextLabel: string
  clearLabel: string
  /** Latest selectable end (e.g. 8 days after the start), optional. */
  maxDays?: number
  className?: string
}

const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const same = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime()

export function DateRangePicker({ value, onValueChange, previousLabel, nextLabel, clearLabel, maxDays, className }: DateRangePickerProps) {
  const locale = useLocale()
  const today = useMemo(() => day0(new Date()), [])
  const [month, setMonth] = useState(() => new Date((value.start ?? today).getFullYear(), (value.start ?? today).getMonth(), 1))
  const [focus, setFocus] = useState<Date>(value.start ?? today)
  const grid = useRef<HTMLDivElement>(null)
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const first = month.getDay()
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
  const cells: (Date | null)[] = [...Array.from({ length: first }, () => null), ...days]
  while (cells.length % 7) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  const atCurrent = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()
  const tooLate = (d: Date) => !!maxDays && !!value.start && !value.end && d.getTime() > value.start.getTime() + (maxDays - 1) * 864e5

  const pick = (d: Date) => {
    if (!value.start || value.end || d < value.start) onValueChange({ start: d, end: null })
    else onValueChange({ start: value.start, end: d })
  }
  const move = (delta: number) => {
    const n = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + delta)
    if (n < today) return
    setFocus(n)
    if (n.getMonth() !== month.getMonth() || n.getFullYear() !== month.getFullYear()) setMonth(new Date(n.getFullYear(), n.getMonth(), 1))
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus())
  }
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }
    if (e.key in map) {
      e.preventDefault()
      move(map[e.key])
    }
  }

  return (
    <div className={cn('flex w-[280px] flex-col gap-[var(--space-1)]', className)}>
      <div className="flex items-center justify-between">
        <IconButton label={previousLabel} icon={<ChevronLeft />} disabled={atCurrent} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
        <span aria-live="polite" className="type-body-label text-ui-fg">{monthName}</span>
        <IconButton label={nextLabel} icon={<ChevronRight />} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
      </div>
      <div ref={grid} role="grid" aria-label={monthName} onKeyDown={onKey} className="flex flex-col gap-[var(--space-0-5)]">
        <div role="row" className="grid grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={`w${i}`} role="columnheader" className="flex items-center justify-center py-[var(--space-1)] type-body-caption text-ui-fg-muted">
              {weekday.format(new Date(2026, 9, 4 + i))}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} role="row" className="grid grid-cols-7">
            {week.map((d, i) => {
              if (!d) return <span key={`b${i}`} role="gridcell" />
              const start = same(d, value.start)
              const end = same(d, value.end)
              const inRange = !!value.start && !!value.end && d > value.start && d < value.end
              const isFocus = same(d, focus) || (!days.some((x) => same(x, focus)) && d.getDate() === 1)
              return (
                <span key={d.getDate()} role="gridcell" aria-selected={start || end || inRange}>
                  <CalendarDay
                    day={d.getDate()}
                    label={full.format(d)}
                    today={same(d, today)}
                    position={start ? 'start' : end ? 'end' : inRange ? 'in-range' : undefined}
                    disabled={d < today || tooLate(d)}
                    tabIndex={isFocus ? 0 : -1}
                    onClick={() => {
                      setFocus(d)
                      pick(d)
                    }}
                  />
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {value.start ? (
        <button type="button" onClick={() => onValueChange({ start: null, end: null })} className="self-end type-body-link text-ui-link underline underline-offset-2 transition-colors duration-short4 ease-standard hover:text-ui-link-hover focus-visible:shadow-focus-ring focus-visible:outline-none">
          {clearLabel}
        </button>
      ) : null}
    </div>
  )
}
