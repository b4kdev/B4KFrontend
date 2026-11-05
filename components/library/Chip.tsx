import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { HIT_AREA, LIFT, PRESS } from './styles'

// Chip (Figma Atoms › Chip). Types (Skyscanner Backpack): Selectable (filter chip, toggles),
// Dismissible (applied filter with ×, always selected), Dropdown (opens a menu or sheet, ▾),
// Icon only (32 square), Map (filled chip floating over the map).
// 36 high, 44 tap area; chip radius role, body/chip, never wraps. Idle: control fill with the
// resting shadow. Selected: the selected-chip role. Map chips: glass over the map; pressed, the
// map-chip role (a direction that leaves it unset falls back to the chip's key colour).

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Type. */
  type?: 'selectable' | 'dismissible' | 'dropdown' | 'icon-only' | 'map'
  /** Figma Selected. */
  selected?: boolean
  /** Figma Show leading icon + Icon. */
  leadingIcon?: ReactNode
  /** Figma Show count + Count, e.g. All 31. */
  count?: number | string
  /** Figma Label. For icon-only chips this is the accessible name. */
  children: ReactNode
  /** Dismissible: accessible name of the ×, e.g. "Remove K-Pop filter". */
  dismissLabel?: string
  /** Map chips: the type colour (a CSS colour) for the leading icon. */
  keyColor?: string
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { type = 'selectable', selected = false, leadingIcon, count, children, dismissLabel, keyColor, className, style, ...props },
  ref,
) {
  const isSelected = type === 'dismissible' || selected
  const iconOnly = type === 'icon-only'
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={type === 'selectable' || type === 'map' ? selected : undefined}
      aria-haspopup={type === 'dropdown' ? 'menu' : undefined}
      aria-label={iconOnly ? String(children) : type === 'dismissible' ? dismissLabel : undefined}
      style={keyColor ? ({ ...style, '--chip-c': keyColor } as CSSProperties) : style}
      className={cn(
        'relative inline-flex h-[var(--chip-height-map)] shrink-0 items-center justify-center gap-[var(--gap-sm)] whitespace-nowrap rounded-chip type-body-chip',
        PRESS,
        'focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed',
        iconOnly ? 'w-[var(--chip-height-map)]' : type === 'dropdown' ? 'pl-[var(--space-4)] pr-[var(--space-3)]' : 'px-[var(--space-4)]',
        isSelected && type === 'map'
          ? 'bg-[var(--map-chip-selected-bg,var(--chip-c))] text-map-ui-chip-selected-fg shadow-accent'
          : isSelected
            ? 'bg-chip-selected-bg text-chip-selected-fg shadow-accent'
            : type === 'map'
              ? 'b4k-glass bg-map-ui-overlay text-ui-fg shadow-float'
              : cn('bg-control-fill text-ui-fg', LIFT, '[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:bg-control-fill-hover'),
        'disabled:text-ui-fg-disabled disabled:shadow-none',
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {leadingIcon ? (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-[var(--icon-size-sm)] shrink-0 [&>svg]:size-full',
            isSelected ? 'text-current' : keyColor ? 'text-[var(--chip-c)]' : 'text-ui-fg-muted',
          )}
        >
          {leadingIcon}
        </span>
      ) : null}
      {iconOnly ? null : (
        <span className="inline-flex items-center gap-[var(--gap-xs)]">
          {children}
          {count !== undefined ? <span>{count}</span> : null}
        </span>
      )}
      {type === 'dropdown' ? <ChevronDown aria-hidden className="size-[var(--icon-size-sm)] shrink-0" /> : null}
      {type === 'dismissible' ? <X aria-hidden className="size-[var(--icon-size-sm)] shrink-0" /> : null}
    </button>
  )
})
