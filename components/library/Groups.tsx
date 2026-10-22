'use client'

import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { Minus, Plus, Star, StarHalf, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'
import { MapControl } from './Map'

// Button group, Rating, Zoom control, Route map preview.

export type ButtonGroupProps = {
  /** Figma Type. Actions: primary last on the right. Stacked: full width, primary first (mobile). */
  type?: 'actions' | 'stacked'
  label?: string
  children: ReactNode
  className?: string
}

export function ButtonGroup({ type = 'actions', label, children, className }: ButtonGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(type === 'actions' ? 'flex flex-wrap items-center justify-end gap-[var(--gap-sm)]' : 'flex flex-col gap-[var(--gap-sm)] [&>*]:w-full', className)}
    >
      {children}
    </div>
  )
}

export type SelectionBarProps = {
  /** e.g. "3 selected". */
  countText: string
  /** Small Ghost and Danger buttons. */
  children: ReactNode
  onClear: () => void
  clearLabel: string
  label: string
  className?: string
}

/** Button group Type=Selection bar: shows while items are selected; sticks to the bottom of the list. */
export function SelectionBar({ countText, children, onClear, clearLabel, label, className }: SelectionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn('sticky bottom-0 flex min-h-[var(--space-12)] items-center gap-[var(--space-2)] border border-ui-border bg-ui-bg-raised py-[var(--space-1)] pl-[var(--space-4)] pr-[var(--space-1)]', className)}
    >
      <span aria-live="polite" className="flex-1 type-title-card text-ui-fg">{countText}</span>
      <div className="flex items-center gap-[var(--gap-sm)]">{children}</div>
      <IconButton label={clearLabel} icon={<X />} onClick={onClear} />
    </div>
  )
}

export type RatingProps =
  | { type?: 'display'; value: number; countText?: string; label: string; className?: string }
  | { type: 'input'; value: number; onValueChange: (v: number) => void; label: string; valueText?: string; starLabels: string[]; className?: string }

/** Rating (build-ahead): monochrome stars. Display = text with sr-only label; Input = radiogroup. */
export function Rating(props: RatingProps) {
  const id = useId()
  if (props.type === 'input') {
    const { value, onValueChange, label, valueText, starLabels, className } = props
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onValueChange(Math.min(5, value + 1))
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onValueChange(Math.max(1, value - 1))
      else return
      e.preventDefault()
    }
    return (
      <div className={cn('flex flex-col gap-[var(--space-1)]', className)}>
        <span id={`${id}-l`} className="type-body-label text-ui-fg-muted">{label}</span>
        <div role="radiogroup" aria-labelledby={`${id}-l`} onKeyDown={onKey} className="flex items-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={starLabels[n - 1]}
              tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
              onClick={() => onValueChange(n)}
              className="inline-flex size-[var(--target-touch-min)] items-center justify-center text-ui-fg focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              <Star aria-hidden className={cn('size-[var(--icon-size-lg)]', n <= value ? 'fill-current' : 'text-ui-border-strong')} />
            </button>
          ))}
        </div>
        {valueText ? <span className="type-body-caption text-ui-fg-muted">{valueText}</span> : null}
      </div>
    )
  }
  const { value, countText, label, className } = props
  return (
    <span className={cn('inline-flex items-center gap-[var(--space-2)] type-body-caption text-ui-fg', className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="inline-flex gap-[var(--space-0-5)]">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="relative inline-flex size-[var(--icon-size-sm)]">
            <Star className="absolute inset-0 size-full text-ui-border-strong" />
            {value >= n ? <Star className="absolute inset-0 size-full fill-current" /> : value >= n - 0.5 ? <StarHalf className="absolute inset-0 size-full fill-current" /> : null}
          </span>
        ))}
      </span>
      <span aria-hidden className="type-body-label">{value.toFixed(1)}</span>
      {countText ? <span aria-hidden className="text-ui-fg-muted">({countText})</span> : null}
    </span>
  )
}

export type ZoomControlProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  zoomInLabel: string
  zoomOutLabel: string
  atMax?: boolean
  atMin?: boolean
  className?: string
}

/** Zoom control: two Map controls sharing one border, bottom right on desktop and tablet. */
export function ZoomControl({ onZoomIn, onZoomOut, zoomInLabel, zoomOutLabel, atMax, atMin, className }: ZoomControlProps) {
  return (
    <div className={cn('flex flex-col [&>button+button]:-mt-px', className)}>
      <MapControl icon={<Plus />} label={zoomInLabel} onClick={onZoomIn} disabled={atMax} aria-disabled={atMax} />
      <MapControl icon={<Minus />} label={zoomOutLabel} onClick={onZoomOut} disabled={atMin} aria-disabled={atMin} />
    </div>
  )
}

export type RouteMapPreviewProps = {
  /** Static map image in the B4K Naver style; a neutral surface until it exists. */
  src?: string
  /** Stop positions in percent of the box, in order; days color the badges. */
  stops: { x: number; y: number; day?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }[]
  className?: string
}

const DAY_BG = ['', 'bg-plan-day-1 text-plan-day-1-fg', 'bg-plan-day-2 text-plan-day-2-fg', 'bg-plan-day-3 text-plan-day-3-fg', 'bg-plan-day-4 text-plan-day-4-fg', 'bg-plan-day-5 text-plan-day-5-fg', 'bg-plan-day-6 text-plan-day-6-fg', 'bg-plan-day-7 text-plan-day-7-fg', 'bg-plan-day-8 text-plan-day-8-fg']

/** Route map preview: small map with Stop badges md on a 2px fg route line, radius/2xl. Decorative. */
export function RouteMapPreview({ src, stops, className }: RouteMapPreviewProps) {
  return (
    <div aria-hidden className={cn('relative aspect-[320/140] w-full overflow-hidden rounded-2xl bg-ui-bg-sunken', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="absolute inset-0 size-full object-cover" /> : null}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-ui-fg">
        <polyline points={stops.map((s) => `${s.x},${s.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {stops.map((s, i) => (
        <span
          key={i}
          className={cn('absolute inline-flex size-[var(--stop-badge-size-md)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full type-body-label', s.day ? DAY_BG[s.day] : 'bg-ui-bg-inverse text-ui-fg-inverse')}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}
