import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, FOCUS_RING_INSET, HIT_AREA } from './styles'

// Navigation atoms (Figma Atoms): Tab, Segment, Page item, Nav item, Step item.

const DAY_DOT = {
  1: 'bg-plan-day-1', 2: 'bg-plan-day-2', 3: 'bg-plan-day-3', 4: 'bg-plan-day-4',
  5: 'bg-plan-day-5', 6: 'bg-plan-day-6', 7: 'bg-plan-day-7', 8: 'bg-plan-day-8',
} as const

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected?: boolean
  /** Figma Show day dot: 8 dot in the plan day color (UI-78). */
  day?: keyof typeof DAY_DOT
  children: ReactNode
}

/** Tab (part of Tabs, CMP-044): 44 high; selected = fg label with a 2px fg underline. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ selected = false, day, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={cn(
        'relative inline-flex h-[var(--target-touch-min)] shrink-0 items-center gap-[var(--space-1-5)] px-[var(--space-4)] type-body-base',
        'transition-colors duration-short4 ease-standard disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected ? 'text-ui-fg' : 'text-ui-fg-muted enabled:hover:text-ui-fg',
        "after:absolute after:inset-x-0 after:bottom-0 after:h-[var(--border-width-2)] after:content-['']",
        selected && 'after:bg-ui-fg',
        FOCUS_RING_INSET,
        className,
      )}
      {...props}
    >
      {day ? <span aria-hidden className={cn('size-[var(--space-2)] shrink-0 rounded-full', DAY_DOT[day])} /> : null}
      {children}
    </button>
  )
})

export type SegmentProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { selected?: boolean; children: ReactNode }

/** Segment (part of Segmented control, CMP-006): pill; selected = bg-inverse, fg-inverse. */
export const Segment = forwardRef<HTMLButtonElement, SegmentProps>(function Segment({ selected = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'relative inline-flex h-[var(--control-height-sm)] flex-1 items-center justify-center whitespace-nowrap rounded-full px-[var(--space-3)] type-body-base',
        'transition-colors duration-short4 ease-standard disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected ? 'bg-ui-bg-inverse text-ui-fg-inverse' : 'text-ui-fg-muted enabled:hover:bg-ui-state-hover enabled:hover:text-ui-fg',
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

/** Page item (part of Pagination, CMP-045): 40 round; current = bg-inverse, aria-current page. */
export const PageItem = forwardRef<HTMLButtonElement, PageItemProps>(function PageItem({ current = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'relative inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-full type-body-base',
        current ? 'bg-ui-bg-inverse text-ui-fg-inverse' : 'text-ui-fg hover:bg-ui-state-hover',
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
  className?: string
}

/**
 * Nav item (part of Navigation bar and rail, CMP-040, CMP-041): icon only (UI-70), 48 high; active =
 * fg icon with a 4 fg dot below, inactive fg-muted. Render it inside a link (next-intl Link) or a
 * button; this is the visual.
 */
export function NavItem({ icon, label, active = false, badge, className }: NavItemProps) {
  return (
    <span
      className={cn(
        'relative flex h-[var(--control-height-xl)] w-full flex-col items-center justify-center gap-[var(--space-1)]',
        active ? 'text-ui-fg' : 'text-ui-fg-muted group-hover:text-ui-fg',
        className,
      )}
    >
      <span className="relative inline-flex size-[var(--icon-size-md)] [&>svg]:size-full">
        {icon}
        {badge ? <span className="absolute -right-[6px] -top-[4px]">{badge}</span> : null}
      </span>
      <span aria-hidden className={cn('size-[var(--space-1)] rounded-full', active ? 'bg-ui-fg' : 'bg-transparent')} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Class for the link or button around a NavItem: hover layer, inset focus ring, 44 target. */
export const NAV_ITEM_TARGET = cn('group block w-full hover:bg-ui-state-hover', FOCUS_RING_INSET)

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
          state === 'upcoming' ? 'border border-ui-border-strong text-ui-fg-muted' : 'bg-ui-bg-inverse text-ui-fg-inverse',
        )}
      >
        {state === 'done' ? <Check className="size-[var(--icon-size-xs)]" strokeWidth={3} /> : number}
      </span>
      <span className={cn(state === 'current' ? 'type-body-label text-ui-fg' : 'type-body-caption text-ui-fg-muted')}>{label}</span>
    </li>
  )
}
