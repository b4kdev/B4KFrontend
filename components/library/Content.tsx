import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, HIT_AREA } from './styles'

// Content atoms (Figma Atoms): Stat counter, Credit line, Image action, Forecast day, Chat bubble, Scrim, Calendar day.

export type StatCounterProps = {
  /** Figma Number. */
  number: ReactNode
  /** Figma Label, e.g. "Trips". */
  label: string
  /** Figma Separator=On: a middle dot before (all stats but the first). */
  separator?: boolean
}

/** Stat counter: number then label on one line; read as one text ("12 Trips"). */
export function StatCounter({ number, label, separator }: StatCounterProps) {
  return (
    <span className="inline-flex items-baseline gap-[var(--space-2)]">
      {separator ? <span aria-hidden className="type-body-base text-ui-fg-muted">·</span> : null}
      <span className="inline-flex items-baseline gap-[var(--space-1)]">
        <span className="type-title-card text-ui-fg">{number}</span>
        <span className="type-body-base text-ui-fg-muted">{label}</span>
      </span>
    </span>
  )
}

/** Credit line: photo credit under a place photo, info icon and caption, muted. */
export function CreditLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted', className)}>
      <Info aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export type ImageActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma State=On: filled icon, aria-pressed. */
  on?: boolean
  /** Outline icon (Off) and filled icon (On), e.g. two Lucide bookmarks with fill. */
  icon: ReactNode
  /** With the place name, e.g. "Save Gyeongbokgung". */
  label: string
}

/** Image action: round 32 button on a photo, scrim behind a 16 icon in fg-on-media. */
export const ImageAction = forwardRef<HTMLButtonElement, ImageActionProps>(function ImageAction(
  { on = false, icon, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={on}
      className={cn(
        'relative inline-flex size-[var(--control-height-sm)] shrink-0 items-center justify-center rounded-full bg-ui-scrim text-ui-fg-on-media',
        '[&>svg]:size-[var(--icon-size-sm)]',
        on && '[&>svg]:fill-current',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
})

export type ForecastDayProps = {
  /** Figma Day, e.g. "MON" (eyebrow, uppercase by style). */
  day: string
  /** Condition icon with its alt text. */
  icon: ReactNode
  /** Figma Range, e.g. "21° / 13°". */
  range: string
  /** Full reading, e.g. "Monday, cloudy, 13 to 21 degrees". */
  label: string
}

/** Forecast day: one day of the forecast in the Now Seoul card. */
export function ForecastDay({ day, icon, range, label }: ForecastDayProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-col items-center gap-[var(--space-1)]">
      <span aria-hidden className="type-eyebrow-category text-ui-fg-muted">{day}</span>
      <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] text-ui-fg-muted [&>svg]:size-full">{icon}</span>
      <span aria-hidden className="type-body-caption text-ui-fg">{range}</span>
    </div>
  )
}

export type ChatBubbleProps = {
  /** Figma Role. */
  role: 'user' | 'assistant' | 'typing'
  children?: ReactNode
  /** Typing: screen reader text, announced once (e.g. "B4K is typing"). */
  typingLabel?: string
}

/** Chat bubble: radius/2xl, body/base; user = inverse, right; assistant = sunken, left. */
export function ChatBubble({ role, children, typingLabel }: ChatBubbleProps) {
  return (
    <div className={cn('flex w-full', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-[var(--space-3)] py-[var(--space-2)] type-body-base',
          role === 'user' ? 'bg-ui-bg-inverse text-ui-fg-inverse' : 'bg-ui-bg-sunken text-ui-fg',
        )}
      >
        {role === 'typing' ? (
          <span className="flex items-center gap-[var(--space-1)]">
            <span className="sr-only">{typingLabel}</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="size-[6px] rounded-full bg-ui-fg-muted motion-safe:animate-b4k-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

/** Scrim: dimming layer behind Modal, Dialog and Bottom sheet. Blocking never closes on click. */
export function Scrim({ kind = 'default', onClick, className }: { kind?: 'default' | 'blocking'; onClick?: () => void; className?: string }) {
  return (
    <div
      aria-hidden
      onClick={kind === 'default' ? onClick : undefined}
      className={cn('fixed inset-0', kind === 'default' ? 'bg-ui-scrim' : 'bg-ui-backdrop-blocking', className)}
    />
  )
}

export type CalendarDayProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Day: the number shown. */
  day: number
  /** Full date, e.g. "Monday, 20 October 2026". */
  label: string
  today?: boolean
  /** Figma State=Start / End / In range. */
  position?: 'start' | 'end' | 'in-range'
}

/** Calendar day: 40 square; start and end = bg-inverse; in range = state-selected; today = ring. */
export const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(function CalendarDay(
  { day, label, today, position, className, ...props },
  ref,
) {
  const end = position === 'start' || position === 'end'
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={end || undefined}
      className={cn(
        'relative inline-flex size-[var(--control-height-md)] items-center justify-center',
        end ? 'bg-ui-bg-inverse type-body-label text-ui-fg-inverse' : position === 'in-range' ? 'bg-ui-state-selected type-body-base text-ui-fg' : 'type-body-base text-ui-fg enabled:hover:bg-ui-state-hover',
        'disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        // Focus ring: 2px square, 2px in from the cell edge.
        'focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:-outline-offset-[calc(var(--focus-ring-offset)_+_var(--focus-ring-width))] focus-visible:outline-ui-border-focus',
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {today && !end ? <span aria-hidden className="absolute inset-0 rounded-full border border-ui-border-strong" /> : null}
      <span className="relative">{day}</span>
    </button>
  )
})
