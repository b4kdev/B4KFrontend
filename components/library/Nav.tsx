import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, FOCUS_RING_INSET, HIT_AREA } from './styles'
import { Glyph, type GlyphName } from './Glyph'

// Navigation atoms (Figma Atoms): Tab, Segment, Page item, Nav item, Step item.

const DAY_DOT = {
  1: 'bg-plan-day-1', 2: 'bg-plan-day-2', 3: 'bg-plan-day-3', 4: 'bg-plan-day-4',
  5: 'bg-plan-day-5', 6: 'bg-plan-day-6', 7: 'bg-plan-day-7', 8: 'bg-plan-day-8',
} as const

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected?: boolean
  /** Figma Show day dot: a 10 colour key in the plan day colour; the selected tab fills with it. */
  day?: keyof typeof DAY_DOT
  /** The selected fill (a CSS colour, e.g. var(--category-pop)); ink on it is black. Left out: inverse. */
  color?: string
  /** A leading glyph tile in `color` (category tabs). */
  glyph?: GlyphName
  children: ReactNode
}

/** Tab (part of Tabs): a 40 squircle on the tab track; idle = muted label; selected = filled with its
 * colour and black ink (All and plain tabs: inverse). */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ selected = false, day, color, glyph, children, className, style, ...props }, ref) {
  const fill = color ?? (day ? `var(--plan-day-${day})` : undefined)
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      style={fill ? ({ ...style, '--tab-c': fill } as CSSProperties) : style}
      className={cn(
        'relative inline-flex h-[var(--control-height-md)] shrink-0 items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-sq-md px-[var(--space-4)] type-label-button font-[var(--font-weight-semibold)]',
        'transition-[background-color,color,transform] duration-short4 ease-out-strong enabled:active:scale-[var(--press-scale)] disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected
          ? fill
            ? 'bg-[var(--tab-c)] text-field-fg'
            : 'bg-ui-bg-inverse text-ui-fg-inverse'
          : 'text-ui-fg-muted enabled:hover:text-ui-fg',
        glyph && 'pl-[var(--space-2)] pr-[var(--space-3)]',
        // Focus ring inside the tab in an ink that holds on its fill: black on a colour, the inverse
        // ink on the inverse fill, the focus colour on the track.
        FOCUS_RING_INSET,
        selected && (fill ? 'focus-visible:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--field-fg)]' : 'focus-visible:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-fg-inverse)]'),
        className,
      )}
      {...props}
    >
      {glyph ? (
        <span aria-hidden className={cn('inline-flex size-[22px] shrink-0 items-center justify-center rounded-[7px]', selected ? 'bg-field-fg text-[var(--tab-c)]' : 'bg-[var(--tab-c)] text-field-fg')}>
          <Glyph name={glyph} size={13} />
        </span>
      ) : null}
      {day ? (
        <span
          aria-hidden
          className={cn(
            'size-[10px] shrink-0 rounded-[3px]',
            selected ? 'bg-field-fg' : cn(DAY_DOT[day], 'shadow-[inset_0_0_0_1px_var(--color-border)] dark:shadow-none'),
          )}
        />
      ) : null}
      {children}
    </button>
  )
})

export type SegmentProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { selected?: boolean; children: ReactNode }

/** Segment (part of Segmented control): squircle; selected = bg-inverse, fg-inverse. */
export const Segment = forwardRef<HTMLButtonElement, SegmentProps>(function Segment({ selected = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'relative inline-flex h-[var(--control-height-sm)] flex-1 items-center justify-center whitespace-nowrap rounded-sq-sm px-[var(--space-3)] type-body-base',
        'transition-colors duration-short4 ease-standard disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        selected ? 'bg-ui-bg-inverse text-ui-fg-inverse disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled' : 'text-ui-fg enabled:hover:bg-ui-state-hover',
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

/** Page item (part of Pagination): 40 squircle; current = bg-inverse, aria-current page. */
export const PageItem = forwardRef<HTMLButtonElement, PageItemProps>(function PageItem({ current = false, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'relative inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-sq-md type-body-base',
        current ? 'bg-ui-bg-inverse text-ui-fg-inverse' : 'bg-control-fill text-ui-fg hover:bg-control-fill-hover',
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
  /** The item's colour (a CSS colour, var(--nav-*)): the current tile's fill and, in dark, the idle icon. */
  color?: string
  /** lg: the 52 Quick plan tile on the phone bar, always filled. */
  size?: 'md' | 'lg'
  className?: string
}

/**
 * Nav item (part of Navigation bar and rail): a 44 squircle tile behind a 20 icon. Idle: the idle
 * tile with the icon in the item's colour (dark) or ink (light); hover: the hover tile; current:
 * the tile fills with the item's colour, black icon, a little larger. Render it inside a link
 * (next-intl Link) or a button; this is the visual.
 */
export function NavItem({ icon, label, active = false, badge, color, size = 'md', className }: NavItemProps) {
  return (
    <span
      style={color ? ({ '--nav-c': color } as CSSProperties) : undefined}
      className={cn('relative flex h-[var(--control-height-xl)] w-full items-center justify-center', className)}
    >
      <span
        className={cn(
          'relative inline-flex items-center justify-center rounded-sq-md transition-[background-color,transform] duration-short4 ease-out-strong group-active:scale-[0.92] motion-reduce:group-active:scale-100',
          size === 'lg' ? 'size-[var(--nav-quick-plan-size)] rounded-sq-lg' : 'size-[var(--nav-tile-size)]',
          active || size === 'lg'
            ? 'scale-[1.08] bg-[var(--nav-c,var(--color-bg-inverse))] text-field-fg group-active:scale-100'
            : // Dark: the icon in the item's colour; light: ink (pastel icons on white fall under 3:1).
            'bg-nav-tile-idle text-nav-icon-idle dark:text-[var(--nav-c,var(--color-fg))] [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-nav-tile-hover',
          size === 'lg' && 'scale-100',
        )}
      >
        <span className={cn('relative inline-flex size-[var(--icon-size-md)] [&>svg]:size-full', size === 'lg' ? '[&>svg]:[stroke-width:2.4]' : '[&>svg]:[stroke-width:2.2]')}>
          {icon}
          {/* Figma: the badge starts at the icon's center line, 6 above the icon. */}
          {badge ? <span className="absolute left-1/2 -top-[var(--space-1-5)] flex">{badge}</span> : null}
        </span>
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Class for the link or button around a NavItem: inset focus ring, 44 target (the tile shows hover). */
export const NAV_ITEM_TARGET = cn('group block w-full rounded-sq-md', FOCUS_RING_INSET)

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
      <span className={cn(state === 'current' ? 'type-body-label text-ui-fg' : state === 'done' ? 'type-body-base text-ui-fg' : 'type-body-base text-ui-fg-muted')}>{label}</span>
    </li>
  )
}
