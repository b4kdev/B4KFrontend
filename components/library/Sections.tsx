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

const RAIL = '-mx-[var(--grid-gutter-mobile)] flex snap-x snap-mandatory scroll-px-[var(--grid-gutter-mobile)] gap-[var(--space-3)] overflow-x-auto px-[var(--grid-gutter-mobile)] pb-[var(--space-1)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:scroll-px-0 lg:px-0'

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
  useEffect(measure, [measure, cards.length])
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
}

/** Explore collections: header, filter chips, grid of Card Collection (4 across, 2 on phones). */
export function ExploreCollections({ title, filters, active, onFilter, cards }: ExploreCollectionsProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-[var(--space-4)]">
      <SectionHeader id={id} title={title} />
      <div className="flex gap-[var(--space-2)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => <Chip key={f.id} selected={f.id === active} onClick={() => onFilter(f.id)} className="shrink-0">{f.label}</Chip>)}
      </div>
      <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4">{cards.map((c, i) => <li key={i}>{c}</li>)}</ul>
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

/** Planning cue: three tiles between content rows; side by side on desktop, stacked on phones. */
export function PlanningCue({ state, label, tiles }: PlanningCueProps) {
  const tile = 'flex min-h-[var(--target-touch-min)] flex-1 items-center gap-[var(--space-4)] rounded-2xl bg-ui-bg-raised p-[var(--space-4)] md:py-[var(--space-6)] text-left text-ui-fg hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))] focus-visible:shadow-focus-ring focus-visible:outline-none'
  const body = (icon: ReactNode, t: { title: string; text: string }) => (
    <>
      <span aria-hidden className="inline-flex size-[var(--icon-size-lg)] shrink-0 [&>svg]:size-full">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <span className="type-title-card">{t.title}</span>
        <span className="line-clamp-2 [text-wrap:pretty] type-body-base text-ui-fg-muted">{t.text}</span>
      </span>
      <ChevronRight aria-hidden className="size-[var(--icon-size-lg)] shrink-0 text-ui-fg" />
    </>
  )
  const first = state === 'continue' && tiles.continue ? tiles.continue : tiles.newPlan
  return (
    <section aria-label={label} className="flex gap-[var(--space-3)] max-md:flex-col">
      <IntlLink href={first.href} className={tile}>{body(state === 'continue' ? <Route /> : <Plus />, first)}</IntlLink>
      <button type="button" onClick={tiles.quickPlan.onOpen} className={tile}>{body(<Zap />, tiles.quickPlan)}</button>
      <IntlLink href={tiles.fromSaved.href} className={tile}>{body(<Bookmark />, tiles.fromSaved)}</IntlLink>
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
    <section aria-labelledby={id} className="flex flex-col gap-[var(--space-3)] rounded-2xl bg-ui-bg-raised p-[var(--space-4)] text-ui-fg">
      <div className="flex items-center">
        <h2 id={id} className="min-w-0 flex-1 type-title-card">{title}</h2>
        <IconButton label={labels.dismiss} icon={<X />} onClick={onDismiss} />
      </div>
      <p className="type-body-base text-ui-fg-muted">{text}</p>
      <div className="flex flex-wrap gap-[var(--space-2)]">
        {tags.map((t) => <Chip key={t.id} selected={selected.includes(t.id)} onClick={() => onToggle(t.id)}>{t.label}</Chip>)}
      </div>
      <Button variant="secondary" size="lg" disabled={!selected.length} onClick={onSave} className="max-md:w-full md:self-start">{labels.save}</Button>
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
  /** Progress text, e.g. "Step 2 of 3". */
  progressLabel: string
  /** Figma Show step list (option B spare) instead of the progress bar. */
  stepList?: string[]
  /** Step body (destination and who-with chips; interest chips; review rows). */
  children: ReactNode
  /** Desktop: the right column of step 1 (the calendar); below the body on phones. */
  aside?: ReactNode
  /** Footer: Back (steps 2, 3) and Next / Make my plan. */
  back?: { label: string; onClick: () => void }
  next: { label: string; onClick: () => void; disabled?: boolean }
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
  useEffect(() => {
    if (open) heading.current?.focus()
  }, [step, open])
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
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-ui-bg-elevated text-ui-fg',
          phone ? 'inset-x-0 bottom-0 max-h-[min(768px,92dvh)] rounded-t-3xl border border-ui-border motion-safe:animate-b4k-sheet-in' : 'left-1/2 top-1/2 max-h-[90dvh] w-[min(864px,calc(100%-var(--space-8)))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ui-border',
        )}
      >
        {phone ? <div className="flex justify-center py-[var(--space-2)]"><span aria-hidden className="h-[var(--space-1)] w-[var(--space-8)] rounded-full bg-ui-border-strong" /></div> : null}
        <div className={cn('flex items-center gap-[var(--space-4)] pr-[var(--space-3)]', phone ? 'pb-[var(--space-4)] pl-[var(--space-4)] pt-[var(--space-2)]' : 'py-[var(--space-4)] pl-[var(--space-6)]')}>
          <div className="min-w-0 flex-1">
            {stepList ? <StepList label={progressLabel} steps={stepList} current={step} /> : <ProgressIndicator step={step} steps={3} label={progressLabel} className="max-w-[320px]" />}
          </div>
          <IconButton label={closeLabel} icon={<X />} onClick={onClose} />
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
          <Button size="lg" onClick={next.onClick} disabled={next.disabled}>{next.label}</Button>
        </div>
      </div>
    </>
  )
}
