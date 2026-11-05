import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, FOCUS_RING_INSET, HIT_AREA } from './styles'

// Navigation atoms (Figma Atoms): Tab, Segment, Page item, Nav item, Step item.

type PlanDay = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected?: boolean
  /** Figma Show day dot: an 8 dot in the plan day colour before the label. */
  day?: PlanDay
  /** The tab's own colour (a CSS colour, e.g. var(--category-pop)): an 8 dot before the label; a
   * direction that leaves the selected-tab role unset fills the selected tab with it. */
  color?: string
  children: ReactNode
}

/** Tab (part of Tabs): 36 on the tab track; idle = muted label; selected = the selected-tab role
 * (fallback: the tab's own colour with black ink, or inverse). */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ selected = false, day, color, children, className, style, ...props }, ref) {
  const own = color ?? (day ? `var(--plan-day-${day})` : undefined)
  const vars = { '--tab-c': own ?? 'var(--color-bg-inverse)', '--tab-fg': own ? 'var(--field-fg)' : 'var(--color-fg-inverse)' } as CSSProperties
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      style={{ ...vars, ...style }}
      className={cn(
        'relative inline-flex h-[var(--chip-height-map)] shrink-0 items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-tab px-[var(--space-4)] type-body-chip',
        'transition-[background-color,box-shadow,color,transform] duration-short4 ease-out-strong enabled:active:scale-[var(--press-scale)] motion-reduce:enabled:active:scale-100',
        'disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected
          ? 'bg-[var(--tab-selected-bg,var(--tab-c))] text-[var(--tab-selected-fg,var(--tab-fg))] shadow-tab-selected'
          : 'text-ui-fg-muted enabled:hover:text-ui-fg',
        FOCUS_RING_INSET,
        className,
      )}
      {...props}
    >
      {own ? <span aria-hidden className="size-[var(--glyph-size-sm)] shrink-0 rounded-full bg-[var(--tab-c)]" /> : null}
      {children}
    </button>
  )
})

export type SegmentProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { selected?: boolean; children: ReactNode }

/** Segment (part of Segmented control): on the tab track; selected = the selected-tab role. */
export const Segment = forwardRef<HTMLButtonElement, SegmentProps>(function Segment({ selected = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'relative inline-flex h-[var(--control-height-sm)] flex-1 items-center justify-center whitespace-nowrap rounded-tab px-[var(--space-3)] type-body-chip',
        'transition-[background-color,box-shadow,color] duration-short4 ease-out-strong disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected
          ? 'bg-[var(--tab-selected-bg,var(--color-bg-inverse))] text-[var(--tab-selected-fg,var(--color-fg-inverse))] shadow-tab-selected'
          : 'text-ui-fg-muted enabled:hover:text-ui-fg',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

export type PageItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { current?: boolean; children: ReactNode }

/** Page item (part of Pagination): 40 round; current = bg-inverse, aria-current page. */
export const PageItem = forwardRef<HTMLButtonElement, PageItemProps>(function PageItem({ current = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'relative inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-control type-body-base',
        current ? 'bg-chip-selected-bg text-chip-selected-fg' : 'bg-control-fill text-ui-fg shadow-rest hover:bg-control-fill-hover',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

export type NavItemProps = {
  /** Figma Icon. */
  icon: ReactNode
  /** Accessible name; on desktop also wrap it in a Tooltip. */
  label: string
  active?: boolean
  /** Count badge or dot over the icon. */
  badge?: ReactNode
  /** The item's own colour (a CSS colour, var(--nav-*)): the fallback for the current-item roles. */
  color?: string
  /** rail: desktop rail item; bar: phone bottom bar item; action: the phone Quick plan button. */
  place?: 'rail' | 'bar' | 'action'
  className?: string
}

/**
 * Nav item (part of Navigation bar and rail): a 44 item behind a 20 icon (24 on the phone bar).
 * Idle: the idle icon colour; hover: the hover fill; current: the current-item role (rail) or the
 * phone current role with a 4 dot (bar). The phone Quick plan is a 48 accent button. Render it
 * inside a link (next-intl Link) or a button; this is the visual.
 */
export function NavItem({ icon, label, active = false, badge, color, place = 'rail', className }: NavItemProps) {
  const action = place === 'action'
  return (
    <span
      style={color ? ({ '--nav-c': color } as CSSProperties) : undefined}
      className={cn('relative flex w-full items-center justify-center', action ? 'h-[var(--nav-quick-plan-size)]' : 'h-[var(--nav-tile-size)]', className)}
    >
      <span
        className={cn(
          'relative inline-flex items-center justify-center rounded-nav-item',
          'transition-[background-color,box-shadow,color,transform] duration-short4 ease-out-strong group-active:scale-[0.92] motion-reduce:group-active:scale-100',
          action ? 'size-[var(--nav-quick-plan-size)] bg-nav-quick-plan text-field-fg shadow-accent' : 'size-[var(--nav-tile-size)]',
          !action &&
            (active
              ? place === 'bar'
                ? 'bg-[var(--nav-current-phone-bg,var(--nav-c,var(--color-bg-inverse)))] text-[var(--nav-current-phone-fg,var(--field-fg))]'
                : 'bg-[var(--nav-current-bg,var(--nav-c,var(--color-bg-inverse)))] text-[var(--nav-current-fg,var(--field-fg))] shadow-accent'
              : 'text-nav-icon-idle [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-nav-tile-hover'),
        )}
      >
        <span className={cn('relative inline-flex [&>svg]:size-full', place === 'bar' ? 'size-[var(--icon-size-lg)]' : 'size-[var(--icon-size-md)]')}>
          {icon}
          {/* Figma: the badge starts at the icon's center line, 6 above the icon. */}
          {badge ? <span className="absolute left-1/2 -top-[var(--space-1-5)] flex">{badge}</span> : null}
        </span>
        {place === 'bar' && active ? (
          <span aria-hidden className="absolute bottom-[var(--space-0-5)] left-1/2 size-[var(--space-1)] -translate-x-1/2 rounded-full bg-field-hero" />
        ) : null}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Class for the link or button around a NavItem: inset focus ring, 44 target (the item shows hover). */
export const NAV_ITEM_TARGET = cn('group block w-full rounded-nav-item', FOCUS_RING_INSET)

export type StepItemProps = {
  /** Figma Label. */
  label: string
  /** Figma Number. */
  number: number
  /** Figma State. */
  state?: 'upcoming' | 'current' | 'done'
  className?: string
}

/** Step item (part of Step list, Quick plan option B): li in an ol, aria-current step on the current. */
export function StepItem({ label, number, state = 'upcoming', className }: StepItemProps) {
  return (
    <li aria-current={state === 'current' ? 'step' : undefined} className={cn('flex items-center gap-[var(--gap-sm)]', className)}>
      <span
        aria-hidden
        className={cn(
          'inline-flex size-[var(--control-box-size)] shrink-0 items-center justify-center rounded-full type-body-caption',
          state === 'upcoming' ? 'bg-tile-surface-sunken text-ui-fg-muted' : 'bg-accent-progress text-field-fg',
        )}
      >
        {state === 'done' ? <Check className="size-[var(--icon-size-xs)]" strokeWidth={3} /> : number}
      </span>
      <span className={cn(state === 'current' ? 'type-body-label text-ui-fg' : state === 'done' ? 'type-body-base text-ui-fg' : 'type-body-base text-ui-fg-muted')}>{label}</span>
    </li>
  )
}
