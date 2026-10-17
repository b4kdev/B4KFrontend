import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Car, Clock, Footprints, GripVertical, Route, TrainFront } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'
import { FOCUS_RING, HIT_AREA } from './styles'

// Planning atoms (UI-73, UI-77, UI-78; Figma Atoms): Stop badge, Drag handle, Transport mode, Plan pill.

const DAY_FILL = {
  0: 'bg-ui-bg-inverse text-ui-fg-inverse',
  1: 'bg-plan-day-1 text-plan-day-1-fg',
  2: 'bg-plan-day-2 text-plan-day-2-fg',
  3: 'bg-plan-day-3 text-plan-day-3-fg',
  4: 'bg-plan-day-4 text-plan-day-4-fg',
  5: 'bg-plan-day-5 text-plan-day-5-fg',
  6: 'bg-plan-day-6 text-plan-day-6-fg',
  7: 'bg-plan-day-7 text-plan-day-7-fg',
  8: 'bg-plan-day-8 text-plan-day-8-fg',
} as const

export type StopBadgeProps = {
  /** Figma Number, 1 to 99. */
  number: number
  size?: 'sm' | 'md'
  /** Figma Day: 1 to 8 = plan day color (UI-78); 0 / left out = None (inverse). */
  day?: keyof typeof DAY_FILL
  /** Next to the stop name it is decorative; on the map pass a label ("Stop 2, Day 1"). */
  label?: string
  className?: string
}

/** Stop badge: numbered itinerary stop. sm 20 (lists, plan panel), md 24 (route preview, map, timeline). */
export function StopBadge({ number, size = 'sm', day = 0, label, className }: StopBadgeProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full type-numeric-count',
        size === 'sm' ? 'size-[var(--stop-badge-size-sm)]' : 'size-[var(--stop-badge-size-md)]',
        DAY_FILL[day],
        className,
      )}
    >
      {number}
    </span>
  )
}

export type DragHandleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Type: Grabber resizes a sheet, Grip reorders a row. */
  type?: 'grabber' | 'grip'
  /** e.g. "Resize" or "Reorder Gyeongbokgung". */
  label: string
}

/** Drag handle. Grip: show on row hover or focus on desktop, always on touch; arrow keys move. */
export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(function DragHandle(
  { type = 'grip', label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center text-ui-fg-muted',
        type === 'grip' ? 'size-[var(--control-box-size)] cursor-grab active:cursor-grabbing' : 'h-[var(--space-6)] w-[var(--space-12)] cursor-ns-resize',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {type === 'grip' ? (
        <GripVertical aria-hidden className="size-[var(--icon-size-xs)]" />
      ) : (
        <span aria-hidden className="h-[var(--space-1)] w-[var(--space-8)] rounded-full bg-ui-border-strong" />
      )}
    </button>
  )
})

const MODE_ICON = { car: Car, public: TrainFront, walk: Footprints, estimate: Clock } as const

export type TransportModeProps = {
  /** Figma Mode. Estimate = plan in progress, read only. */
  mode: keyof typeof MODE_ICON
  /** Mode name from the messages, e.g. "Car" or "About". */
  modeLabel: string
  /** Figma Time, e.g. "10 min". */
  time: string
  /** Owner can change the mode: a button that opens the mode choice. */
  onChange?: () => void
  /** Figma State=Loading. */
  loading?: boolean
  className?: string
}

/** Transport mode: the leg between two stops, on a 1px rail under the stop badge center. */
export function TransportMode({ mode, modeLabel, time, onChange, loading, className }: TransportModeProps) {
  const Icon = MODE_ICON[mode]
  const content = (
    <>
      {loading ? <Spinner size="sm" className="size-[var(--icon-size-xs)]" /> : <Icon aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />}
      <span>{modeLabel}</span>
      <span>· {time}</span>
    </>
  )
  return (
    <div className={cn('flex items-center py-[var(--space-1-5)] pl-[var(--space-3)]', mode !== 'estimate' && 'border-l border-ui-border-strong', className)}>
      {onChange && mode !== 'estimate' ? (
        <button
          type="button"
          onClick={onChange}
          aria-busy={loading || undefined}
          className={cn('relative inline-flex items-center gap-[var(--space-1-5)] type-body-caption text-ui-fg-muted hover:text-ui-fg', FOCUS_RING, HIT_AREA)}
        >
          {content}
        </button>
      ) : (
        <span className="inline-flex items-center gap-[var(--space-1-5)] type-body-caption text-ui-fg-muted">{content}</span>
      )}
    </div>
  )
}

export type PlanPillProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Label, e.g. "Plan · 3 stops". */
  label: string
  /** Accessible name, e.g. "Open plan, 3 stops". */
  accessibleLabel: string
  expanded?: boolean
}

/** Plan pill: the plan cart on phones, bottom left over the map; hidden with 0 stops. */
export const PlanPill = forwardRef<HTMLButtonElement, PlanPillProps>(function PlanPill(
  { label, accessibleLabel, expanded, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={accessibleLabel}
      aria-expanded={expanded}
      className={cn(
        'inline-flex h-[var(--target-touch-min)] items-center gap-[var(--space-2)] rounded-full border border-ui-border-strong bg-ui-bg-raised px-[var(--space-4)] type-body-label text-ui-fg',
        'hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))]',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <Route aria-hidden className="size-[var(--icon-size-sm)]" />
      {label}
    </button>
  )
})

