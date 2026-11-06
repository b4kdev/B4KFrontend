'use client'

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeft, Bookmark, Clock, Folder, Globe, Heart, Lock, MapPin, Minus, Plus, Route, Share2, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from './Button'
import { ChatBubble, CreditLine } from './Content'
import { AiInput, ItineraryStop, PlanStopRow } from './ContentMolecules'
import { Chip } from './Chip'
import { EmptyState } from './Feedback'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { ListItem, ROW_DIVIDER } from './Lists'
import { Tabs } from './NavGroups'
import { StopBadge, TransportMode } from './Plan'
import { FOCUS_RING_INSET } from './styles'
import type { useSheetSlide } from './hooks'
import { Link as IntlLink } from '@/i18n/navigation'

// Map and planning organisms (Figma Organisms): AI panel, Plan cart,
// Left panel, Saved hub, Itinerary panel, Place detail. Data comes in as props; texts as labels.

type Day = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type AiPanelProps = {
  /** Figma Viewport: desktop floats bottom right of the map (not modal); mobile is full screen. */
  viewport: 'desktop' | 'mobile'
  title: string
  greeting: string
  suggestions: string[]
  onSuggestion: (s: string) => void
  messages: { role: 'user' | 'assistant'; text: ReactNode }[]
  typing?: boolean
  input: { value: string; onValueChange: (v: string) => void; onSend: () => void; placeholder: string; sendLabel: string; disabled?: boolean }
  labels: { minimize: string; close: string; back: string; typing: string }
  onMinimize: () => void
  onClose: () => void
  className?: string
}

/** AI panel: greeting and suggestion chips when empty; chat bubbles in a log; AI input at the bottom. */
export function AiPanel({ viewport, title, greeting, suggestions, onSuggestion, messages, typing, input, labels, onMinimize, onClose, className }: AiPanelProps) {
  const id = useId()
  const desktop = viewport === 'desktop'
  return (
    <section
      role={desktop ? 'complementary' : 'dialog'}
      aria-labelledby={id}
      className={cn('flex flex-col bg-ui-bg-raised text-ui-fg', desktop ? 'h-[min(65vh,640px)] w-[380px] overflow-hidden rounded-tile shadow-menu' : 'h-full w-full', className)}
    >
      <div className={cn('flex items-center gap-[var(--space-2)] border-b border-ui-border', desktop ? 'py-[var(--space-1)] pl-[var(--space-4)] pr-[var(--space-1)]' : 'p-[var(--space-1)]')}>
        {desktop ? null : <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onMinimize} />}
        <Sparkles aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
        <h2 id={id} className="flex-1 type-title-card">{title}</h2>
        {desktop ? (
          <>
            <IconButton label={labels.minimize} icon={<Minus />} onClick={onMinimize} />
            <IconButton label={labels.close} icon={<X />} onClick={onClose} />
          </>
        ) : null}
      </div>
      <div role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto p-[var(--space-4)]">
        {messages.length === 0 ? (
          // Figma Empty: sparkles 32, greeting and chips centred in the log.
          <div className="flex flex-1 flex-col items-center justify-center gap-[var(--space-3)] text-center">
            <Sparkles aria-hidden className="size-[var(--icon-size-xl)] text-ui-fg-muted" />
            <p className="max-w-[300px] type-body-base text-ui-fg-muted">{greeting}</p>
            <div className="flex flex-wrap justify-center gap-[var(--space-2)]">
              {suggestions.map((s) => <Chip key={s} onClick={() => onSuggestion(s)}>{s}</Chip>)}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <ChatBubble key={i} role={m.role}>{m.text}</ChatBubble>)
        )}
        {typing ? <ChatBubble role="typing" typingLabel={labels.typing} /> : null}
      </div>
      <div className="border-t border-ui-border p-[var(--space-3)]">
        <AiInput {...input} />
      </div>
    </section>
  )
}

export type PlanStop = { id: string; name: string; day: Day; duration: string; durationLabel: string; leg?: string; imageSrc?: string | null }

export type PlanCartProps = {
  /** Figma State. */
  state: 'empty' | 'collapsed' | 'open'
  onToggle: () => void
  /** The cart's own handle bar, the one part that opens, closes and drags it (desktop). Phones leave it off: the plan
      sheet around the cart has its own. */
  handle?: boolean
  stops: PlanStop[]
  days: number
  activeDay: 'all' | Day
  onDayChange: (d: 'all' | Day) => void
  onAddDay?: () => void
  /** Delete a day: a × inside the selected day tab while the plan has more than one day. */
  onRemoveDay?: (day: Day) => void
  /** Collapsed summary, e.g. "5 stops · about 6 h"; last added place. */
  summary: string
  lastAdded?: string
  /** Collapsed: the last added place's photo (Figma Last added › Thumbnail, 48). */
  lastAddedImage?: string | null
  /** Collapsed: the line under the last added place, e.g. "Last added · 2 more". */
  lastAddedMeta?: string
  /** Day total for the open day, e.g. "Day 1 · about 4 h". */
  dayTotal?: string
  onDuration?: (id: string) => void
  /** The duration menu's items for a stop (a dropdown under its duration). */
  durationMenu?: (id: string) => ReactNode
  onRemove: (id: string) => void
  /** Tap a stop's name: select it (the map shows it). */
  onSelect?: (id: string) => void
  /** Reorder within a day: put stop `id` in the slot of `toId` (drag the grip, or arrow keys on it). */
  onMove?: (id: string, toId: string) => void
  /** Move a dragged stop to another day: dropped among that day's rows it takes the slot of
   * `beforeId` (none = the end of the day); dropped on the day's tab it goes to the end. */
  onMoveToDay?: (id: string, day: Day, beforeId?: string) => void
  /** A day that takes no more stops (a drop on it is refused, and the held stop says why). */
  dayFull?: (day: Day) => boolean
  onSave: () => void
  onDiscard: () => void
  labels: {
    region: string
    emptyTitle: string
    emptyBody: string
    all: string
    day: (n: number) => string
    addDay: string
    /** Spoken name when the visible label is short ("+ Day" reads as "Add day"). */
    addDayAria?: string
    /** Accessible name of the delete-day button, e.g. "Delete Day 2". */
    removeDay?: (n: number) => string
    /** Shown on a held stop over a full day, e.g. "Day 2 is full." */
    dayFull?: (n: number) => string
    /** Day tabs scroll arrows. */
    previousDays?: string
    nextDays?: string
    save: string
    discard: string
    remove: (name: string) => string
    reorder: (name: string) => string
    /** Read out after a stop moves, e.g. "Gwangjang Market moved to position 2 of 4." (stops in that day). */
    moved?: (name: string, position: number, total: number) => string
    open: string
    close: string
    about: string
  }
  className?: string
}

/** Plan cart: the plan as a shopping cart at the bottom of the Left panel. */
/** The plan tray's leading tile: the add accent with the route icon, centred on the title's first
 * line (`titleTop`: where that line starts in the cart), so tile and title read as one row. */
function TrayTile({ titleTop }: { titleTop: 'space-4' | 'space-8' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute left-[var(--space-4)] inline-flex size-[var(--nav-tile-size)] items-center justify-center rounded-sq-md bg-accent-add text-field-fg',
        titleTop === 'space-8'
          ? 'top-[calc(var(--space-8)+(var(--title-size-card)*var(--leading-tight)-var(--nav-tile-size))/2)]'
          : 'top-[calc(var(--space-4)+(var(--title-size-card)*var(--leading-tight)-var(--nav-tile-size))/2)]',
      )}
    >
      <Route size={18} />
    </span>
  )
}

export function PlanCart({ state, onToggle, handle = true, stops, days, activeDay, onDayChange, onAddDay, onRemoveDay, summary, lastAdded, lastAddedImage, lastAddedMeta, dayTotal, onDuration, durationMenu, onRemove, onSelect, onMove, onMoveToDay, dayFull, onSave, onDiscard, labels, className }: PlanCartProps) {
  const id = useId()
  // A drag in progress: the held stop follows the pointer freely; the other stops slide out of the
  // way to show where it will land. In All days the landing slot can sit in another day's rows: the
  // drop moves the stop to that day at that slot. Over a day tab the tab lights up and a drop moves
  // the stop to the end of that day (as dropping a file on a folder). A full day takes nothing: the
  // held stop says so and nothing slides. `from` and `at` count the rows shown, all days in All.
  const [drag, setDrag] = useState<{ id: string; day: Day; from: number; at: number; toDay: Day; dy: number; height: number; dropDay: Day | null; full: Day | null; x: number; y: number; outside: boolean } | null>(null)
  const dragId = drag?.id ?? null
  const start = useRef<{ y: number; centers: number[]; tops: number[]; bottoms: number[]; ids: string[]; days: Day[] } | null>(null)
  const list = useRef<HTMLOListElement>(null)
  // Where each row was on screen at the drop, so the rows glide from there into their new places.
  const settle = useRef<Map<string, number> | null>(null)
  const rowsOf = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[data-drag-item]') ?? [])
  useLayoutEffect(() => {
    const before = settle.current
    if (!before) return
    settle.current = null
    for (const el of rowsOf()) {
      const top = before.get(el.dataset.dragItem ?? '')
      if (top === undefined) continue
      const shift = top - el.getBoundingClientRect().top
      if (!shift) continue
      el.style.transition = 'none'
      el.style.transform = `translateY(${shift}px)`
      void el.offsetHeight
      el.style.transition = ''
      el.style.transform = ''
    }
  })
  // Screen readers hear where a moved stop landed (keyboard move, or the end of a drag).
  const [announce, setAnnounce] = useState('')
  const say = (s: PlanStop, sameDay: PlanStop[], position: number) => labels.moved && setAnnounce(labels.moved(s.name, position, sameDay.length))
  const endDrag = (s: PlanStop) => {
    const d = drag
    const st = start.current
    setDrag(null)
    start.current = null
    if (!d || d.id !== s.id || !st) return
    if (d.full && labels.dayFull) setAnnounce(labels.dayFull(d.full))
    settle.current = new Map(rowsOf().map((el) => [el.dataset.dragItem ?? '', el.getBoundingClientRect().top]))
    if (d.dropDay && onMoveToDay) {
      onMoveToDay(s.id, d.dropDay)
      return
    }
    // The other rows, in order, and the landing slot among them.
    const others = st.ids.filter((x) => x !== s.id)
    if (d.toDay !== s.day && onMoveToDay) {
      const before = others[d.at]
      onMoveToDay(s.id, d.toDay, before && st.days[st.ids.indexOf(before)] === d.toDay ? before : undefined)
      const into = stops.filter((x) => x.day === d.toDay)
      say(s, [...into, s], others.slice(0, d.at).filter((x) => st.days[st.ids.indexOf(x)] === d.toDay).length + 1)
      return
    }
    const sameDay = stops.filter((x) => x.day === s.day)
    const to = others.slice(0, d.at).filter((x) => st.days[st.ids.indexOf(x)] === s.day).length
    if (to !== sameDay.indexOf(s) && onMove) onMove(s.id, sameDay[to].id)
    const order = sameDay.filter((x) => x.id !== s.id)
    order.splice(to, 0, s)
    say(s, order, to + 1)
  }
  // Grip handlers: arrow keys swap with the next stop of the same day; a pointer drag (mouse or
  // touch) moves the stop freely, and it lands where the pointer lets go.
  const handleProps = (s: PlanStop) =>
    onMove
      ? {
          onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            const sameDay = stops.filter((x) => x.day === s.day)
            const next = sameDay[sameDay.indexOf(s) + (e.key === 'ArrowUp' ? -1 : 1)]
            if (!next) return
            onMove(s.id, next.id)
            say(s, sameDay, sameDay.indexOf(next) + 1)
          },
          onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            const rows = rowsOf()
            const ids = rows.map((el) => el.dataset.dragItem ?? '')
            const boxes = rows.map((el) => el.getBoundingClientRect())
            // A day's first row carries the day label: the label stays put, only the stop moves.
            const label = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-day-label]')?.getBoundingClientRect().height ?? 0
            const from = ids.indexOf(s.id)
            start.current = { y: e.clientY, centers: boxes.map((b, i) => b.top + label(rows[i]) + (b.height - label(rows[i])) / 2), tops: boxes.map((b) => b.top), bottoms: boxes.map((b) => b.bottom), ids, days: ids.map((x) => stops.find((p) => p.id === x)?.day ?? s.day) }
            setDrag({ id: s.id, day: s.day, from, at: from, toDay: s.day, dy: 0, height: (boxes[from]?.height ?? 0) - (rows[from] ? label(rows[from]) : 0), dropDay: null, full: null, x: e.clientX, y: e.clientY, outside: false })
          },
          onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
            const st = start.current
            if (!st || drag?.id !== s.id) return
            const dy = e.clientY - st.y
            const tab = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[role="tab"]')
            const n = Number(tab?.id.replace(/^tab-/, ''))
            const onTab = tab && list.current?.parentElement?.contains(tab) && n && n !== s.day ? (n as Day) : null
            // The landing slot: how many of the other rows sit above the held stop's middle. Its day is
            // the day of the row under that middle, or (between days, over a day label) the next row's.
            const mid = st.centers[drag.from] + dy
            const others = st.ids.map((_, i) => i).filter((i) => i !== drag.from)
            const k = others.filter((i) => st.centers[i] < mid).length
            const over = others.find((i) => st.tops[i] <= mid && mid < st.bottoms[i])
            const rowDay = onTab ?? (over !== undefined ? st.days[over] : others[k] !== undefined ? st.days[others[k]] : others.length ? st.days[others[others.length - 1]] : s.day)
            const full = rowDay !== s.day && dayFull?.(rowDay) ? rowDay : null
            const dropDay = onTab && !full ? onTab : null
            const toDay = full || onTab ? s.day : rowDay
            const at = full || onTab ? drag.from : k
            // Out of the list (up at the day tabs) the list clips the row, so a copy follows the pointer.
            const box = list.current?.getBoundingClientRect()
            const outside = !!box && (e.clientY < box.top || e.clientY > box.bottom || e.clientX < box.left || e.clientX > box.right)
            setDrag({ ...drag, dy, at, toDay, dropDay, full, x: e.clientX, y: e.clientY, outside })
          },
          onPointerUp: () => endDrag(s),
          onPointerCancel: () => {
            setDrag(null)
            start.current = null
          },
        }
      : undefined
  // The slide of each row while a stop is held: the held stop under the pointer, the rows after its
  // old slot one row up, the rows from its new slot one row down. A day label stays put: on a day's
  // first row only the stop slides, so the gap opens under the label.
  const dragShift = (s: PlanStop): { row?: CSSProperties; stop?: CSSProperties } => {
    if (!drag) return {}
    const ids = start.current?.ids ?? []
    const i = ids.indexOf(s.id)
    if (i < 0) return {}
    if (s.id === drag.id) return { row: { zIndex: 20, position: 'relative' }, stop: { transform: `translateY(${drag.dy}px)`, transition: 'none', opacity: drag.outside ? 0 : 1 } }
    const j = i > drag.from ? i - 1 : i
    const up = i > drag.from ? -drag.height : 0
    const down = j >= drag.at ? drag.height : 0
    const move = (y: number) => (y ? { transform: `translateY(${y}px)` } : undefined)
    // Opening the gap at a day's top: the label slides with the rows above, its stop drops below it.
    const firstOfDay = start.current?.days[i - 1] !== start.current?.days[i]
    if (firstOfDay && activeDay === 'all' && j === drag.at && s.day === drag.toDay) return { row: move(up), stop: move(down) }
    return { row: move(up + down) }
  }
  if (state === 'empty') {
    return (
      <section aria-label={labels.region} className={cn('relative rounded-t-tile bg-ui-bg-raised py-[var(--space-4)] pl-[calc(var(--space-4)+var(--nav-tile-size)+var(--space-4))] pr-[var(--space-4)]', className)}>
        <TrayTile titleTop="space-4" />
        <p className="type-title-card font-[var(--font-weight-extrabold)] text-ui-fg">{labels.emptyTitle}</p>
        <p className="mt-[var(--space-3)] type-body-caption text-ui-fg-muted">{labels.emptyBody}</p>
      </section>
    )
  }
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'relative flex flex-col rounded-t-tile bg-ui-bg-raised text-ui-fg',
        state === 'open'
          ? cn('h-full gap-[var(--space-3)] p-[var(--space-4)]', handle && 'pt-[var(--space-8)]')
          : 'pl-[calc(var(--nav-tile-size)+var(--space-4))]',
        className,
      )}
    >
      {state === 'collapsed' ? <TrayTile titleTop={handle ? 'space-8' : 'space-4'} /> : null}
      <p aria-live="polite" className="sr-only">{announce}</p>
      {/* Open: the Left panel's color/bg, everything inside the root's 16 padding; collapsed: the color/bg-sunken bar (Figma Plan cart). */}
      {/* The handle: the bar 12 from the cart's top, centred, in a grab zone across the cart that ends where the title
          starts (the 32 above it), so a click on the title does nothing. Only the handle opens, closes and drags the cart. */}
      {handle ? (
        <button
          type="button"
          data-sheet-handle
          aria-expanded={state === 'open'}
          aria-label={state === 'open' ? labels.close : labels.open}
          onClick={onToggle}
          className={cn('absolute inset-x-[var(--space-4)] top-0 z-10 flex h-[var(--space-8)] touch-none select-none cursor-grab justify-center rounded-sq-md pt-[var(--space-3)] active:cursor-grabbing', FOCUS_RING_INSET)}
        >
          <span aria-hidden className="h-[calc(var(--space-1)+var(--border-width-1))] w-[var(--space-12)] rounded-[3px] bg-sheet-handle" />
        </button>
      ) : null}
      <div className={cn('flex w-full flex-col gap-[var(--space-3)]', state === 'collapsed' && cn('p-[var(--space-4)]', handle && 'pt-[var(--space-8)]'))}>
        <span id={id} aria-live="polite" className="min-w-0 type-title-card font-[var(--font-weight-extrabold)]">{summary}</span>
        {/* Figma Plan cart Collapsed › Last added: photo, place, "Last added · 2 more". */}
        {state === 'collapsed' && lastAdded ? (
          <span className="flex min-w-0 items-center gap-[var(--space-3)]">
            {lastAddedImage !== undefined ? <Image ratio="1:1" src={lastAddedImage} alt="" sizes="80px" className="w-[var(--space-12)] shrink-0 rounded-sq-md" /> : null}
            <span className="flex min-w-0 flex-col gap-[var(--space-0-5)]">
              <span className="truncate type-body-base text-ui-fg">{lastAdded}</span>
              {lastAddedMeta ? <span className="truncate type-body-caption text-ui-fg-muted">{lastAddedMeta}</span> : null}
            </span>
          </span>
        ) : null}
      </div>
      {state === 'open' ? (
        <>
          {/* "+ Day" follows the last day tab with no gap, as drawn. */}
          <div className="flex items-center">
            <Tabs
              label={labels.region}
              baseline={false}
              value={String(activeDay)}
              onValueChange={(v) => onDayChange(v === 'all' ? 'all' : (Number(v) as Day))}
              tabs={[
                { id: 'all', label: labels.all },
                ...Array.from({ length: days }, (_, i) => ({
                  id: String(i + 1),
                  label: labels.day(i + 1),
                  day: (i + 1) as Day,
                  // The × shows on the selected day only.
                  // The × shows on the selected day, and on any day tab under a mouse or keyboard focus.
                  onClose: onRemoveDay && days > 1 ? () => onRemoveDay((i + 1) as Day) : undefined,
                  // Lights up while a held stop is over it, or over its rows in All days: letting go moves the stop to this day.
                  dropTarget: !!drag && (drag.dropDay === i + 1 || (drag.toDay !== drag.day && drag.toDay === i + 1)),
                  closeLabel: labels.removeDay?.(i + 1),
                })),
              ]}
              scrollLabels={labels.previousDays && labels.nextDays ? { previous: labels.previousDays, next: labels.nextDays } : undefined}
              className="min-w-0"
            />
            {/* Figma "+ Day": a Tab-styled text button (44 high, px 16, body/base, fg-muted). */}
            {onAddDay && days < 8 ? (
              <button type="button" onClick={onAddDay} aria-label={labels.addDayAria} className={cn('inline-flex min-h-[var(--target-touch-min)] shrink-0 items-center whitespace-nowrap px-[var(--space-4)] type-body-base text-ui-fg-muted hover:bg-ui-state-hover hover:text-ui-fg', FOCUS_RING_INSET)}>
                {labels.addDay}
              </button>
            ) : null}
          </div>
          <ol ref={list} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {/* No stops yet: the hint under the tabs, Save off and no Discard (nothing to discard). */}
            {/* In All days the hint sits under the Day 1 label, as drawn. */}
            {stops.length ? null : (
              <li className="list-none">
                {activeDay === 'all' ? <p className="pb-[var(--space-1)] pt-[var(--space-3)] type-eyebrow-category uppercase text-ui-fg-muted">{labels.day(1)}</p> : null}
                <p className="type-body-base text-ui-fg-muted">{labels.emptyBody}</p>
              </li>
            )}
            {shown.map((s, i) => {
              const shift = dragShift(s)
              return (
              <li key={s.id} data-drag-item={s.id} style={shift.row} className="list-none transition-transform duration-short4 ease-out-strong motion-reduce:transition-none">
                {/* All days: each day's stops under its label, numbered from 1 in that day (Figma Day label). */}
                {activeDay === 'all' && shown[i - 1]?.day !== s.day ? <p data-day-label className="pb-[var(--space-1)] pt-[var(--space-3)] type-eyebrow-category uppercase text-ui-fg-muted">{labels.day(s.day)}</p> : null}
                <div style={shift.stop} className="transition-transform duration-short4 ease-out-strong motion-reduce:transition-none">
                <ul>
                  <PlanStopRow name={s.name} thumbnail={s.imageSrc} number={stops.filter((x) => x.day === s.day).indexOf(s) + 1} day={s.day} duration={s.duration} durationLabel={s.durationLabel} onDuration={onDuration ? () => onDuration(s.id) : undefined} durationMenu={durationMenu?.(s.id)} onRemove={() => onRemove(s.id)} removeLabel={labels.remove(s.name)} reorderLabel={labels.reorder(s.name)} stopId={s.id} handleProps={handleProps(s)} dragging={dragId === s.id} onSelect={onSelect ? () => onSelect(s.id) : undefined} />
                </ul>
                {s.leg && i < shown.length - 1 ? <div className={cn('ml-[calc(var(--space-12)+var(--space-2))]', dragId === s.id && 'invisible')}><TransportMode mode="estimate" modeLabel={labels.about} time={s.leg} /></div> : null}
                </div>
              </li>
              )
            })}
          </ol>
          {drag?.outside || (drag?.full && labels.dayFull) ? (() => {
            const held = stops.find((x) => x.id === drag.id)
            // Over a full day the copy says why the drop will not take (in the list, only that line).
            const note = drag.full && labels.dayFull ? <span className="type-body-caption text-ui-fg-muted">{labels.dayFull(drag.full)}</span> : null
            return held ? (
              <div aria-hidden className="pointer-events-none fixed z-50 flex max-w-[240px] flex-col gap-[var(--space-1)] rounded-sq-md bg-ui-bg-elevated px-[var(--space-3)] py-[var(--space-2)] shadow-menu" style={{ left: drag.x + 12, top: drag.y + 12 }}>
                {drag.outside ? (
                  <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                    <StopBadge number={stops.filter((x) => x.day === held.day).indexOf(held) + 1} day={held.day} />
                    <span className="truncate type-body-base text-ui-fg">{held.name}</span>
                  </span>
                ) : null}
                {note}
              </div>
            ) : null
          })() : null}
          {dayTotal ? (
            <p className="flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted">
              <Clock aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
              {dayTotal}
            </p>
          ) : null}
          <div className="flex flex-col gap-[var(--space-3)]">
            <Button size="md" onClick={onSave} disabled={!stops.length} className="w-full">{labels.save}</Button>
            {stops.length ? <Button variant="ghost" size="md" onClick={onDiscard} className="w-full">{labels.discard}</Button> : null}
          </div>
        </>
      ) : null}
    </section>
  )
}

export type LeftPanelProps = {
  /** Figma Type: Map 420 (content and Plan cart), Index 280 (tree only), Filters 420 (search filters). */
  type: 'map' | 'index' | 'filters'
  label: string
  /** Content slot (Browse, Place detail, Saved hub, a Tree view, Search filters). */
  children: ReactNode
  /** Map type: the Plan cart; Open covers the panel. */
  cart?: ReactNode
  cartOpen?: boolean
  /** Map type: the open cart rises over the panel and drops back down (useSheetSlide; drag on its bar). */
  cartSlide?: ReturnType<typeof useSheetSlide>
  /** Top inset kept clear for the Universal search (shell without a top nav). */
  topClear?: boolean
  className?: string
}

/** Left panel: desktop panel next to the rail; complementary landmark. */
export function LeftPanel({ type, label, children, cart, cartOpen, cartSlide, topClear, className }: LeftPanelProps) {
  const raised = cartSlide ? cartSlide.mounted : cartOpen
  return (
    <aside aria-label={label} className={cn('relative flex h-full shrink-0 flex-col bg-ui-bg', cartSlide && 'overflow-hidden', type === 'index' ? 'w-[var(--layout-left-panel-index)]' : 'w-[var(--layout-left-panel)]', topClear && 'pt-[calc(var(--space-3)+var(--control-height-xl)+var(--space-3))]', className)}>
      {/* With a sliding cart the panel's content hides once the cart has risen over it, and shows again as soon as it starts down. */}
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto scroll-py-[calc(var(--focus-ring-offset)+var(--focus-ring-width))]', cartOpen && 'invisible', cartOpen && cartSlide && 'transition-[visibility] delay-[var(--duration-medium2)]')}>{children}</div>
      {type === 'map' && cart ? (
        <div
          ref={raised && cartSlide ? (n) => { cartSlide.ref.current = n } : undefined}
          style={raised ? cartSlide?.style : undefined}
          onTransitionEnd={raised ? cartSlide?.onTransitionEnd : undefined}
          {...(raised && cartSlide ? cartSlide.grab : {})}
          className={cn(raised ? 'absolute inset-0 z-10' : 'shrink-0')}
        >
          {cart}
        </div>
      ) : null}
    </aside>
  )
}

export type SavedHubProps = {
  /** Figma View. */
  view: 'places' | 'folder' | 'empty'
  folders?: { id: string; name: string; count: string }[]
  folder?: { name: string; places: { id: string; name: string; meta: string; imageSrc?: string | null }[] }
  onOpenFolder: (id: string) => void
  onBack: () => void
  onAdd: (placeId: string) => void
  /** Folder view: a click or Enter on a place row opens that place (the whole row; its + still adds). */
  onOpenPlace?: (placeId: string) => void
  emptyAction: ReactNode
  labels: { back: string; add: (name: string) => string; emptyTitle: string; emptyBody: string }
}

/** Saved hub: saved places inside the map, for adding them to a plan. */
export function SavedHub({ view, folders = [], folder, onOpenFolder, onBack, onAdd, onOpenPlace, emptyAction, labels }: SavedHubProps) {
  // Figma Saved hub root: color/bg-raised, padding 16, gap 16 in every view.
  const root = 'flex flex-col gap-[var(--space-4)] bg-ui-bg-raised p-[var(--space-4)] text-ui-fg'
  if (view === 'empty') {
    return (
      <div className={root}>
        <EmptyState container="bordered" icon={<Bookmark />} title={labels.emptyTitle} action={emptyAction}>{labels.emptyBody}</EmptyState>
      </div>
    )
  }
  if (view === 'places') {
    return (
      <div className={root}>
        <ul>
          {folders.map((f) => (
            <ListItem key={f.id} title={f.name} secondary={f.count} leading={<Folder />} chevron onClick={() => onOpenFolder(f.id)} />
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div className={root}>
      {/* Figma Folder › Back: Ghost icon button 40 + title/card, gap 4, hugging. */}
      <div className="flex items-center gap-[var(--space-1)]">
        <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onBack} />
        <p className="type-title-card">{folder?.name}</p>
      </div>
      <ul>
        {folder?.places.map((p) =>
          onOpenPlace ? (
            // The whole row opens the place: the name is a button stretched over the row (a row-wide button
            // cannot hold the + button), the + sits above it and keeps its own click.
            <li key={p.id} className={cn(ROW_DIVIDER, 'hover:bg-ui-state-hover has-[[data-poi-id]:focus-visible]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-border-focus)]')}>
              <div className="flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left">
                <span className="inline-flex shrink-0 items-center text-ui-fg-muted"><Image ratio="1:1" src={p.imageSrc} alt="" sizes="80px" className="w-[48px]" /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-0-5)]">
                  <button type="button" data-poi-id={p.id} onClick={() => onOpenPlace(p.id)} className="truncate text-left type-body-base text-ui-fg outline-none after:absolute after:inset-0 after:content-['']">{p.name}</button>
                  {p.meta ? <span className="truncate type-body-caption text-ui-fg-muted">{p.meta}</span> : null}
                </span>
                <span className="relative z-10 inline-flex shrink-0 items-center"><IconButton label={labels.add(p.name)} icon={<Plus />} onClick={() => onAdd(p.id)} /></span>
              </div>
            </li>
          ) : (
          <ListItem
            key={p.id}
            title={p.name}
            secondary={p.meta}
            leading={<Image ratio="1:1" src={p.imageSrc} alt="" sizes="80px" className="w-[48px]" />}
            trailing={<IconButton label={labels.add(p.name)} icon={<Plus />} onClick={() => onAdd(p.id)} />}
          />
          ),
        )}
      </ul>
    </div>
  )
}

export type ItineraryPanelProps = {
  title: string
  owner: string
  /** Figma Owner row › Avatar xs before the name: the owner's photo (null shows initials from `owner`); left out, no avatar. */
  ownerAvatarSrc?: string | null
  /** The owner's name for the avatar initials (owner is the whole line, e.g. "Created by Minji"). */
  ownerName?: string
  /** The owner's profile: the owner line links there. */
  ownerHref?: string
  /** Owner only: lock and Private beside the owner name. */
  privateLabel?: string
  stats: string[]
  days: number
  activeDay: 'all' | Day
  onDayChange: (d: 'all' | Day) => void
  stops: { id: string; name: string; day: Day; meta: string; note?: string; imageSrc?: string | null; leg?: { mode: 'car' | 'public' | 'walk'; label: string; time: string } }[]
  selectedStop?: string
  onSelectStop?: (id: string) => void
  /** Owner can change transport modes. */
  onLeg?: (id: string) => void
  /** Owner: the mode menu's items for the leg after stop `id`, and its accessible name. */
  legMenu?: (id: string) => ReactNode
  legMenuLabel?: (id: string) => string
  related?: ReactNode
  /** Footer buttons: Owner = Edit plan, Share, Delete; Visitor = Save, Like, Share. */
  footer: ReactNode
  labels: { all: string; day: (n: number) => string; days: string; related: string }
}

/** Itinerary panel: title is the page h1; day tabs; stops as an ordered list. */
export function ItineraryPanel({ title, owner, ownerAvatarSrc, ownerName, ownerHref, privateLabel, stats, days, activeDay, onDayChange, stops, selectedStop, onSelectStop, onLeg, legMenu, legMenuLabel, related, footer, labels }: ItineraryPanelProps) {
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <div className="flex h-full flex-col gap-[var(--space-4)] bg-ui-bg p-[var(--space-4)] text-ui-fg">
      <div className="flex flex-col gap-[var(--space-2)]">
        <h1 className="type-display-h1 [overflow-wrap:anywhere] [&:lang(ko)]:break-keep">{title}</h1>
        <p className="flex items-center gap-[var(--space-2)] type-body-caption text-ui-fg-muted">
          {ownerAvatarSrc !== undefined ? <Avatar size="xs" src={ownerAvatarSrc} name={ownerName ?? owner} decorative /> : null}
          {/* The owner link takes 24 to tap; padding grows the box, the same negative margin keeps the line. */}
          {ownerHref ? <IntlLink href={ownerHref} className="block py-[calc((var(--space-6)-1lh)/2)] -my-[calc((var(--space-6)-1lh)/2)] hover:text-ui-fg hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none">{owner}</IntlLink> : owner}
          {privateLabel ? <span className="inline-flex items-center gap-[var(--space-2)]"><Lock aria-hidden className="size-[var(--icon-size-xs)]" />{privateLabel}</span> : null}
        </p>
      </div>
      {/* Figma Itinerary panel: Header, Stats, Day filter, Timeline and Related plans 16 apart. */}
      <p className="rounded-sq-lg bg-accent-stats px-[var(--space-4)] py-[var(--space-3-5)] type-label-button tabular-nums text-field-fg">{stats.join(' · ')}</p>
      <Tabs baseline={false} label={labels.days} value={String(activeDay)} onValueChange={(v) => onDayChange(v === 'all' ? 'all' : (Number(v) as Day))} tabs={[{ id: 'all', label: labels.all }, ...Array.from({ length: days }, (_, i) => ({ id: String(i + 1), label: labels.day(i + 1), day: (i + 1) as Day }))]} />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto">
        <ol className="b4k-stagger">
          {shown.map((s, i) => (
            <li key={s.id} className="list-none">
              {/* Figma Timeline: an eyebrow/category day heading ("DAY 1") where a day starts. */}
              {i === 0 || shown[i - 1].day !== s.day ? <p className="pb-[var(--space-2)] pt-[var(--space-1)] type-eyebrow-category text-ui-fg-muted">{labels.day(s.day)}</p> : null}
              <ul>
                <ItineraryStop name={s.name} number={stops.indexOf(s) + 1} day={s.day} meta={s.meta} note={s.note} thumbnail={s.imageSrc} selected={selectedStop === s.id} onSelect={onSelectStop ? () => onSelectStop(s.id) : undefined} />
              </ul>
              {s.leg && i < shown.length - 1 ? (
                <div className="pl-[var(--space-7)]"><TransportMode mode={s.leg.mode} modeLabel={s.leg.label} time={s.leg.time} onChange={onLeg ? () => onLeg(s.id) : undefined} menu={legMenu?.(s.id)} menuLabel={legMenuLabel?.(s.id)} /></div>
              ) : null}
            </li>
          ))}
        </ol>
        {related ? (
          <section className="flex flex-col gap-[var(--space-2)]">
            <h2 className="mt-[var(--space-4)] type-display-h4">{labels.related}</h2>
            {related}
          </section>
        ) : null}
      </div>
      <div className="flex gap-[var(--space-2)] pt-[var(--space-2)] [&_button]:h-[var(--control-height-xl)] [&_button[aria-label]]:w-[var(--control-height-xl)]">{footer}</div>
    </div>
  )
}

export type PlaceDetailProps = {
  viewport: 'desktop' | 'mobile'
  name: string
  /** category · district · open status */
  meta: string
  imageSrc?: string | null
  imageAlt?: string
  /** Photo credit (Credit line) under the photo; no line without it. */
  credit?: string
  description?: string
  /** Figma Show sponsored (off at launch). */
  sponsored?: string
  details: { icon: 'hours' | 'address' | 'website'; title: string; href?: string }[]
  saved: boolean
  liked: boolean
  onAdd: () => void
  onSave: () => void
  onLike: () => void
  onShare: () => void
  /** noPhoto: the muted line a place without a photo shows under its meta (no photo area). */
  labels: { add: string; save: string; like: string; share: string; noPhoto?: string }
}

/** Place detail: photo, name (display/h2, the page h1), meta, actions (Add to plan, Save, Like, Share), details. */
export function PlaceDetail({ viewport, name, meta, imageSrc, imageAlt, credit, description, sponsored, details, saved, liked, onAdd, onSave, onLike, onShare, labels }: PlaceDetailProps) {
  const ICON = { hours: Clock, address: MapPin, website: Globe } as const
  return (
    <section aria-label={name} className="flex flex-col gap-[var(--space-4)] py-[var(--space-4)] text-ui-fg">
      {imageSrc ? <Image ratio={viewport === 'desktop' ? '4:3' : '16:9'} src={imageSrc} alt={imageAlt ?? ''} sizes="420px" className="mx-[var(--space-3)] w-[calc(100%-var(--space-3)*2)] rounded-tile" /> : null}
      {imageSrc && credit ? <CreditLine className="px-[var(--space-4)]">{credit}</CreditLine> : null}
      <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-4)]">
        {sponsored ? <Badge variant="normal" className="self-start">{sponsored}</Badge> : null}
        <h1 className="type-display-h2 text-[length:min(var(--display-size-h2),34px)] [overflow-wrap:anywhere] [&:lang(ko)]:break-keep">{name}</h1>
        <p className="type-body-base text-ui-fg-muted">{meta}</p>
        {!imageSrc && labels.noPhoto ? <p className="type-body-caption text-ui-fg-muted">{labels.noPhoto}</p> : null}
      </div>
      <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)]">
        <Button size="xl" onClick={onAdd} className="flex-1 bg-accent-add text-field-fg">{labels.add}</Button>
        <IconButton variant="secondary" label={labels.save} aria-pressed={saved} icon={<Bookmark className={saved ? 'fill-current' : undefined} />} onClick={onSave} className="size-[var(--control-height-xl)]" />
        <IconButton variant="secondary" label={labels.like} aria-pressed={liked} icon={<Heart className={liked ? 'fill-current' : undefined} />} onClick={onLike} className="size-[var(--control-height-xl)]" />
        <IconButton variant="secondary" label={labels.share} icon={<Share2 />} onClick={onShare} className="size-[var(--control-height-xl)]" />
      </div>
      {description ? <p className="px-[var(--space-4)] type-body-base text-ui-fg">{description}</p> : null}
      {/* Info rows: sunken squircles, each with a 32 colour tile around its icon. */}
      <ul className="flex flex-col gap-[var(--space-1-5)] px-[var(--space-3)]">
        {details.map((d) => {
          const Icon = ICON[d.icon]
          const lead = (
            <span className="inline-flex size-[var(--control-height-sm)] items-center justify-center rounded-sq-sm bg-accent-avatar text-field-fg [&>svg]:!size-[18px]">
              <Icon />
            </span>
          )
          const row = 'rounded-sq-lg bg-tile-surface-sunken px-[var(--space-1)] [&_svg]:text-field-fg'
          return d.href ? (
            <ListItem key={d.title} title={d.title} leading={lead} divider={false} className={row} onClick={() => window.open(d.href, '_blank', 'noopener')} />
          ) : (
            <ListItem key={d.title} title={d.title} leading={lead} divider={false} className={row} />
          )
        })}
      </ul>
    </section>
  )
}
