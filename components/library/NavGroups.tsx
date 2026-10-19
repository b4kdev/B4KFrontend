'use client'

import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Ellipsis, X } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'
import { PageItem, Segment, StepItem, Tab } from './Nav'

// Navigation molecules (UI-67; Figma Molecules): Tabs, Segmented control, Breadcrumbs, Pagination,
// Progress indicator, Step list.

export type TabsProps = {
  /** Accessible name of the tab list. */
  label: string
  /** `onClose` adds a × inside the tab (e.g. delete a plan day); `closeLabel` is its accessible name. */
  tabs: { id: string; label: ReactNode; day?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; disabled?: boolean; onClose?: () => void; closeLabel?: string }[]
  value: string
  onValueChange: (id: string) => void
  /** Figma Width: Hug (scrolls sideways) or Equal (shares the width, mobile). */
  width?: 'hug' | 'equal'
  /** Hug: accessible names of the scroll arrows shown when the tabs overflow. */
  scrollLabels?: { previous: string; next: string }
  className?: string
}

/** Tabs (CMP-044): switches views in a page or panel, never filters. Arrow keys move. */
export function Tabs({ label, tabs, value, onValueChange, width = 'hug', scrollLabels, className }: TabsProps) {
  const list = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const measure = useCallback(() => {
    const el = list.current
    if (!el) return
    setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 })
  }, [])
  useEffect(() => {
    const el = list.current
    if (!el || width !== 'hug') return
    measure()
    // A vertical wheel scrolls the row sideways (non-passive so the page does not scroll too).
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('wheel', onWheel)
      ro.disconnect()
    }
  }, [width, measure, tabs.length])
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-selected=true]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [value, tabs.length])
  const page = (dir: 1 | -1) => list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.8, behavior: 'smooth' })
  const onKey = (e: KeyboardEvent) => {
    const enabled = tabs.filter((t) => !t.disabled)
    const i = enabled.findIndex((t) => t.id === value)
    const next = e.key === 'ArrowRight' ? enabled[(i + 1) % enabled.length] : e.key === 'ArrowLeft' ? enabled[(i - 1 + enabled.length) % enabled.length] : null
    if (!next) return
    e.preventDefault()
    onValueChange(next.id)
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[aria-selected=true]')?.focus())
  }
  const row = (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKey}
      onScroll={measure}
      className={cn('flex overflow-x-auto border-b border-ui-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', scrollLabels ? 'min-w-0 flex-1' : className)}
    >
      {tabs.map((t) =>
        t.onClose ? (
          <div key={t.id} role="presentation" className="relative flex shrink-0 items-center">
            <Tab id={`tab-${t.id}`} selected={t.id === value} day={t.day} disabled={t.disabled} onClick={() => onValueChange(t.id)} className="shrink-0 pr-[var(--space-8)]">
              {t.label}
            </Tab>
            <button
              type="button"
              aria-label={t.closeLabel}
              onClick={t.onClose}
              className="absolute right-[var(--space-2)] inline-flex size-[var(--space-5)] items-center justify-center rounded-full text-ui-fg-muted hover:bg-ui-state-hover hover:text-ui-fg focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              <X aria-hidden className="size-[var(--icon-size-xs)]" />
            </button>
          </div>
        ) : (
          <Tab key={t.id} id={`tab-${t.id}`} selected={t.id === value} day={t.day} disabled={t.disabled} onClick={() => onValueChange(t.id)} className={width === 'equal' ? 'flex-1 justify-center' : 'shrink-0'}>
            {t.label}
          </Tab>
        ),
      )}
    </div>
  )
  if (!scrollLabels || width !== 'hug') return row
  return (
    <div className={cn('flex items-center', className)}>
      {edges.start ? <IconButton label={scrollLabels.previous} icon={<ChevronLeft />} onClick={() => page(-1)} className="shrink-0" /> : null}
      {row}
      {edges.end ? <IconButton label={scrollLabels.next} icon={<ChevronRight />} onClick={() => page(1)} className="shrink-0" /> : null}
    </div>
  )
}

export type SegmentedControlProps = {
  label: string
  options: { id: string; label: ReactNode }[]
  value: string
  onValueChange: (id: string) => void
  className?: string
}

/** Segmented control (CMP-006): 2 to 4 equal segments on a pill track; one is always selected. */
export function SegmentedControl({ label, options, value, onValueChange, className }: SegmentedControlProps) {
  const onKey = (e: KeyboardEvent) => {
    const i = options.findIndex((o) => o.id === value)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onValueChange(options[(i + 1) % options.length].id)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onValueChange(options[(i - 1 + options.length) % options.length].id)
    else return
    e.preventDefault()
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className={cn('flex rounded-full bg-ui-state-selected p-[var(--space-0-5)]', className)}>
      {options.map((o) => (
        <Segment key={o.id} selected={o.id === value} tabIndex={o.id === value ? 0 : -1} onClick={() => onValueChange(o.id)}>
          {o.label}
        </Segment>
      ))}
    </div>
  )
}

export type BreadcrumbsProps = {
  /** Accessible name, e.g. "Breadcrumb". */
  label: string
  /** Earlier levels link; the last item is the current page. */
  items: { label: string; href?: string }[]
  /** Figma Levels=Collapsed: middle levels behind … on narrow screens. */
  collapseLabel?: string
  className?: string
}

/** Breadcrumbs (CMP-043): eyebrow/category; earlier levels are fg-muted links, current is fg. */
export function Breadcrumbs({ label, items, collapseLabel, className }: BreadcrumbsProps) {
  const last = items.length - 1
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-[var(--space-1-5)] type-eyebrow-category">
        {items.map((it, i) => (
          <Fragment key={`${it.label}-${i}`}>
            {i > 0 ? <ChevronRight aria-hidden className={cn('size-[var(--icon-size-xs)] text-ui-fg-muted', i > 1 && i < last && 'max-md:hidden')} /> : null}
            {collapseLabel && i === 1 && last > 1 ? (
              <li className="md:hidden">
                <span aria-label={collapseLabel} className="inline-flex text-ui-fg-muted"><Ellipsis aria-hidden className="size-[var(--icon-size-xs)]" /></span>
              </li>
            ) : null}
            <li className={cn(i > 0 && i < last && collapseLabel && 'max-md:hidden')}>
              {i === last || !it.href ? (
                <span aria-current={i === last ? 'page' : undefined} className="text-ui-fg">{it.label}</span>
              ) : (
                <IntlLink href={it.href} className="text-ui-fg-muted underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus">
                  {it.label}
                </IntlLink>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

export type PaginationProps = {
  label: string
  /** Figma Type. */
  type?: 'numbered' | 'dots'
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
  previousLabel?: string
  nextLabel?: string
  /** Dots: sr-only status text, e.g. "Page 1 of 4". */
  statusText?: string
  className?: string
}

const pagesAround = (page: number, count: number) => {
  const set = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))
  return Array.from(set).sort((a, b) => a - b)
}

/** Pagination (CMP-045): numbered with previous/next, or dots for carousels. */
export function Pagination({ label, type = 'numbered', page, pageCount, onPageChange, previousLabel = '', nextLabel = '', statusText, className }: PaginationProps) {
  if (type === 'dots') {
    return (
      <div role="status" aria-label={label} className={cn('flex items-center gap-[var(--space-2)]', className)}>
        <span className="sr-only">{statusText}</span>
        {Array.from({ length: pageCount }, (_, i) => (
          <span key={i} aria-hidden className={cn('size-[var(--space-2)] rounded-full', i + 1 === page ? 'bg-ui-fg' : 'bg-ui-border-strong')} />
        ))}
      </div>
    )
  }
  const pages = pagesAround(page, pageCount)
  return (
    <nav aria-label={label} className={cn('flex items-center gap-[var(--space-1)]', className)}>
      <IconButton label={previousLabel} icon={<ChevronLeft />} disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} />
      {pages.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 ? <span aria-hidden className="px-[var(--space-1)] text-ui-fg-muted">…</span> : null}
          <PageItem current={p === page} onClick={() => onPageChange?.(p)}>{p}</PageItem>
        </Fragment>
      ))}
      <IconButton label={nextLabel} icon={<ChevronRight />} disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)} />
    </nav>
  )
}

export type ProgressIndicatorProps = {
  /** Figma Step and Steps. */
  step: number
  steps: number
  /** "Step 2 of 3" from the messages. */
  label: string
  className?: string
}

/** Progress indicator (CMP-032; Quick plan): label above equal segments. */
export function ProgressIndicator({ step, steps, label, className }: ProgressIndicatorProps) {
  return (
    <div className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      <span className="type-body-caption text-ui-fg-muted">{label}</span>
      <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={steps} aria-valuenow={step} aria-valuetext={label} className="flex gap-[var(--space-1)]">
        {Array.from({ length: steps }, (_, i) => (
          <span key={i} className={cn('h-[var(--progress-height)] flex-1 rounded-full', i < step ? 'bg-ui-fg' : 'bg-ui-state-selected')} />
        ))}
      </div>
    </div>
  )
}

export type StepListProps = {
  /** Step names, e.g. Where and when, Interests, Review. */
  steps: string[]
  /** Figma Current: 1-based. */
  current: number
  label: string
  className?: string
}

/** Step list (Quick plan option B, spare): steps joined by chevrons; phones show the current name only. */
export function StepList({ steps, current, label, className }: StepListProps) {
  return (
    <ol aria-label={label} className={cn('flex items-center gap-[var(--space-2)]', className)}>
      {steps.map((s, i) => (
        <Fragment key={s}>
          {i > 0 ? <ChevronRight aria-hidden className="size-[var(--icon-size-xs)] text-ui-fg-muted max-md:hidden" /> : null}
          <StepItem label={s} number={i + 1} state={i + 1 < current ? 'done' : i + 1 === current ? 'current' : 'upcoming'} className={i + 1 !== current ? 'max-md:hidden' : undefined} />
        </Fragment>
      ))}
    </ol>
  )
}
