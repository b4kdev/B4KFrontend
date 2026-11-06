'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, Bookmark, Plus, Route, X, Zap } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Chip } from './Chip'
import { SectionHeader } from './ContentMolecules'
import { IconButton } from './IconButton'
import { ProgressIndicator, StepList } from './NavGroups'
import { useFocusTrap, usePhone } from './hooks'
import { Scrim } from './Content'
import { Separator } from './Separator'

// Sections (Figma Sections): Explore section row, Explore collections,
// Explore packages, Plan card row, Quick plan, Planning cue, Interests card. Built from cards and
// molecules; data as props, texts as labels.

const RAIL = 'b4k-focus-room -mx-[var(--grid-gutter-mobile)] flex snap-x snap-mandatory scroll-px-[var(--grid-gutter-mobile)] gap-[var(--space-3)] overflow-x-auto overflow-y-hidden px-[var(--grid-gutter-mobile)] pb-[var(--space-1)] -mb-[var(--space-1)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:scroll-px-0 lg:px-0'

export type RowSectionProps = {
  title: string
  subtitle?: string
  seeAll?: { href: string; label: string }
  /** Explore section row: an optional Card Featured before the row. */
  featured?: ReactNode
  /** Cards (Card Place for Explore rows, Card Plan for plan rows). */
  cards: ReactNode[]
  /** Figma Show arrows (desktop): Previous / Next buttons in the header that scroll the track. */
  arrowLabels?: { previous: string; next: string }
  className?: string
}

/** Explore section row and Plan card row: header, optional featured card, a sideways row. */
export function RowSection({ title, subtitle, seeAll, featured, cards, arrowLabels, className }: RowSectionProps) {
  const id = useId()
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const measure = useCallback(() => {
    const el = track.current
    if (el) setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
  }, [])
  useEffect(() => {
    measure()
    // The row can start or stop overflowing when the window or the cards change size.
    const el = track.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, cards.length])
  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: 'smooth' })
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-[var(--space-4)]', className)}>
      <SectionHeader
        id={id}
        title={title}
        subtitle={subtitle}
        seeAll={seeAll}
        arrows={arrowLabels ? { onPrevious: () => page(-1), onNext: () => page(1), previousLabel: arrowLabels.previous, nextLabel: arrowLabels.next, atStart: edges.start, atEnd: edges.end } : undefined}
      />
      {featured}
      <ul ref={track} onScroll={measure} className={RAIL}>
        {cards.map((c, i) => <li key={i} className="w-[280px] shrink-0 snap-start">{c}</li>)}
      </ul>
    </section>
  )
}

export type ExploreCollectionsProps = {
  title: string
  filters: { id: string; label: string }[]
  active: string
  onFilter: (id: string) => void
  cards: ReactNode[]
  /** Under the grid while more collections remain (Load more). */
  more?: ReactNode
}

/** Explore collections: header, filter chips, grid of Card Collection (4 across, 2 on phones). */
export function ExploreCollections({ title, filters, active, onFilter, cards, more }: ExploreCollectionsProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-[var(--space-4)]">
      <SectionHeader id={id} title={title} />
      <div className="b4k-focus-room flex gap-[var(--space-2)] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => <Chip key={f.id} selected={f.id === active} onClick={() => onFilter(f.id)} className="shrink-0">{f.label}</Chip>)}
      </div>
      <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4">{cards.map((c, i) => <li key={i}>{c}</li>)}</ul>
      {more}
    </section>
  )
}

/** Explore packages: header and up to 3 Card Package, 3 across from 768, stacked on phones. */
export function ExplorePackages({ title, cards }: { title: string; cards: ReactNode[] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-[var(--space-4)]">
      <SectionHeader id={id} title={title} />
      <ul className="grid gap-[var(--space-3)] md:grid-cols-3">{cards.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}</ul>
    </section>
  )
}

export type PlanningCueProps = {
  /** Figma State: Continue when a plan is in progress. */
  state: 'start' | 'continue'
  label: string
  tiles: {
    newPlan: { href: string; title: string; text: string }
    quickPlan: { onOpen: () => void; title: string; text: string }
    fromSaved: { href: string; title: string; text: string }
    continue?: { href: string; title: string; text: string }
  }
}

/** Planning cue: three tiles between content rows; side by side on desktop, stacked below it. */
export function PlanningCue({ state, label, tiles }: PlanningCueProps) {
  // Three colour fields (new plan powder, Quick plan lime, from Saved stone), black ink, content at
  // the bottom; the chevron slides on hover.
  const tile = 'b4k-press group/tile flex min-h-[var(--action-tile-min-height)] min-w-0 flex-1 items-end gap-[var(--space-4)] rounded-tile px-[var(--space-6)] py-[calc(var(--space-5)+var(--space-0-5))] text-left text-field-fg focus-visible:shadow-focus-ring focus-visible:outline-none max-md:px-[var(--space-5)] max-md:py-[calc(var(--space-4)+var(--space-0-5))]'
  const body = (icon: ReactNode, t: { title: string; text: string }) => (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
        {/* Icon beside the title, level with its first line when the title wraps. */}
        <span className="flex min-w-0 items-start gap-[var(--space-2-5)]">
          <span aria-hidden className="inline-flex size-[var(--title-size-tile)] shrink-0 [&>svg]:size-full [&>svg]:[stroke-width:2.6]">{icon}</span>
          <span className="min-w-0 text-[length:var(--title-size-tile)] font-[var(--font-weight-extrabold)] leading-[1.05] tracking-[-0.03em] [overflow-wrap:anywhere] [&:lang(ko)]:break-keep">{t.title}</span>
        </span>
        <span className="line-clamp-2 [text-wrap:pretty] type-body-base text-[length:calc(var(--font-size-base)-var(--border-width-1))] text-field-fg-muted">{t.text}</span>
      </span>
      <ChevronRight aria-hidden className="size-[var(--icon-size-lg)] shrink-0 transition-transform duration-short4 ease-out-strong [@media(hover:hover)_and_(pointer:fine)]:group-hover/tile:translate-x-[var(--space-1)]" />
    </>
  )
  const first = state === 'continue' && tiles.continue ? tiles.continue : tiles.newPlan
  return (
    <section aria-label={label} className="flex gap-[var(--tile-gap)] max-lg:flex-col">
      <IntlLink href={first.href} className={cn(tile, 'bg-action-new-plan')}>{body(state === 'continue' ? <Route /> : <Plus />, first)}</IntlLink>
      <button type="button" onClick={tiles.quickPlan.onOpen} className={cn(tile, 'bg-action-quick-plan')}>{body(<Zap />, tiles.quickPlan)}</button>
      <IntlLink href={tiles.fromSaved.href} className={cn(tile, 'bg-action-from-saved')}>{body(<Bookmark />, tiles.fromSaved)}</IntlLink>
    </section>
  )
}

export type InterestsCardProps = {
  title: string
  text: string
  tags: { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
  onSave: () => void
  onDismiss: () => void
  labels: { save: string; dismiss: string }
}

/** Interests card: optional, once per account; Selectable chips, Save, Dismiss. */
export function InterestsCard({ title, text, tags, selected, onToggle, onSave, onDismiss, labels }: InterestsCardProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-[var(--space-3)] rounded-tile bg-tile-surface p-[var(--tile-padding)] text-ui-fg">
      <div className="flex items-center">
        <h2 id={id} className="min-w-0 flex-1 type-title-card">{title}</h2>
        <IconButton label={labels.dismiss} icon={<X />} onClick={onDismiss} />
      </div>
      <p className="type-body-base text-ui-fg-muted">{text}</p>
      <div className="flex flex-wrap gap-[var(--space-2)]">
        {tags.map((t) => <Chip key={t.id} selected={selected.includes(t.id)} onClick={() => onToggle(t.id)}>{t.label}</Chip>)}
      </div>
      <Button variant="secondary" size="lg" onClick={onSave} className="max-md:w-full md:self-start">{labels.save}</Button>
    </section>
  )
}

export type QuickPlanProps = {
  open: boolean
  onClose: () => void
  /** Figma Step 1 to 3. */
  step: 1 | 2 | 3
  /** Heading of the current step (focus moves to it). */
  stepTitle: string
  /** Line under the heading, e.g. "Pick a city, your dates and who you're traveling with." */
  stepSubtitle?: string
  /** Progress text, e.g. "Step 2 of 3". With no progressLabel and no stepList the bar shows no
   * indicator and Close sits at the left (one-step sheets such as Your interests). */
  progressLabel?: string
  /** Figma Show step list (option B spare) instead of the progress bar. */
  stepList?: string[]
  /** Step body (destination and who-with chips; interest chips; review rows). */
  children: ReactNode
  /** Desktop: the right column of step 1 (the calendar); below the body on phones. */
  aside?: ReactNode
  /** Footer: Back (steps 2, 3) and Next / Make my plan. */
  back?: { label: string; onClick: () => void }
  next: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean }
  /** Accessible name of the dialog, e.g. "Quick plan". */
  title: string
  closeLabel: string
}

/**
 * Quick plan (planning flow 4; Figma Quick plan): a 3-step dialog, Modal 864 on
 * desktop, sheet on phones. Top bar (progress, Close), separator, body (heading, subtitle, step
 * content), separator, footer (Back ghost, Next primary; right on desktop, Next fills on phones).
 */
export function QuickPlan({ open, onClose, step, stepTitle, stepSubtitle, progressLabel, stepList, children, aside, back, next, title, closeLabel }: QuickPlanProps) {
  const phone = usePhone()
  const ref = useFocusTrap<HTMLDivElement>(open, onClose)
  const heading = useRef<HTMLHeadingElement>(null)
  // Phones: the grabber drags the sheet down; past 80 px (or a tap) it closes.
  const [drag, setDrag] = useState<number | null>(null)
  const start = useRef(0)
  useEffect(() => {
    if (open) heading.current?.focus()
  }, [step, open])
  useEffect(() => { if (!open) setDrag(null) }, [open])
  if (!open) return null
  const padX = phone ? 'px-[var(--space-4)]' : 'px-[var(--space-6)]'
  return (
    <>
      <Scrim onClick={onClose} className="z-50" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={phone && drag ? { transform: `translateY(${drag}px)` } : undefined}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-ui-bg-raised text-ui-fg dark:bg-ui-bg-media',
          phone ? 'inset-x-0 bottom-0 max-h-[min(768px,calc(100dvh-44px))] rounded-t-tile shadow-sheet motion-safe:animate-b4k-sheet-in' : 'left-1/2 top-1/2 max-h-[90dvh] w-[min(864px,calc(100%-var(--space-8)))] -translate-x-1/2 -translate-y-1/2 rounded-tile shadow-menu',
        )}
      >
        {phone ? (
          <div
            aria-hidden
            className="relative z-10 -my-[var(--space-3)] flex touch-none justify-center py-[var(--space-5)]"
            onPointerDown={(e) => {
              start.current = e.clientY
              setDrag(0)
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => drag !== null && setDrag(Math.max(0, e.clientY - start.current))}
            onPointerUp={() => {
              if (drag !== null && (drag > 80 || drag < 8)) onClose()
              setDrag(null)
            }}
          >
            <span className="h-[calc(var(--space-1)+var(--border-width-1))] w-[var(--space-11)] rounded-[3px] bg-sheet-handle" />
          </div>
        ) : null}
        <div className={cn('flex items-center gap-[var(--space-4)] pr-[var(--space-3)]', phone ? 'pb-[var(--space-4)] pl-[var(--space-4)] pt-[var(--space-2)]' : 'py-[var(--space-4)] pl-[var(--space-6)]')}>
          {stepList || progressLabel ? (
            <>
              <div className="min-w-0 flex-1">
                {stepList ? <StepList label={progressLabel ?? title} steps={stepList} current={step} /> : <ProgressIndicator step={step} steps={3} label={progressLabel ?? title} className="max-w-[320px]" />}
              </div>
              <IconButton label={closeLabel} icon={<X />} onClick={onClose} />
            </>
          ) : (
            <IconButton label={closeLabel} icon={<X />} onClick={onClose} />
          )}
        </div>
        <Separator className="shrink-0" />
        <div className={cn('flex min-h-0 flex-1 flex-col gap-[var(--space-5)] overflow-y-auto py-[var(--space-6)]', padX)}>
          <div className="flex flex-col gap-[var(--space-2)]">
            <h2 ref={heading} tabIndex={-1} className="type-display-h3 outline-none">{stepTitle}</h2>
            {stepSubtitle ? <p className="type-body-base text-ui-fg-muted">{stepSubtitle}</p> : null}
          </div>
          {aside && !phone ? (
            <div className="flex gap-[var(--space-6)]">
              <div className="min-w-0 flex-1">{children}</div>
              <div className="w-[280px] shrink-0">{aside}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-[var(--space-6)]">
              {children}
              {aside}
            </div>
          )}
        </div>
        <Separator className="shrink-0" />
        <div className={cn('flex gap-[var(--gap-sm)] py-[var(--space-4)]', padX, phone ? 'pb-[calc(var(--space-4)+env(safe-area-inset-bottom))] [&>:last-child]:flex-1' : 'justify-end')}>
          {back ? <Button variant="ghost" size="lg" onClick={back.onClick}>{back.label}</Button> : null}
          <Button size="lg" onClick={next.onClick} disabled={next.disabled} loading={next.loading}>{next.label}</Button>
        </div>
      </div>
    </>
  )
}
