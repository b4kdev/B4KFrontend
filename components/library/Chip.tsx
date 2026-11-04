import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { HIT_AREA } from './styles'

// Chip (Figma Atoms › Chip). Types (Skyscanner Backpack): Selectable (filter chip, toggles),
// Dismissible (applied filter with ×, always selected), Dropdown (opens a menu or sheet, ▾),
// Icon only (32 square), Map (filled chip floating over the map).
// 32 high (map 36), 44 tap area; squircle (radius sm), padding 12, body/chip. Unselected: control
// fill, fg. Selected: bg-inverse, fg-inverse. Map chips float on the map overlay with a shadow.

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
  /** Map chips: the type colour (a CSS colour). The icon sits in a small tile of it; pressed, the chip
   * fills with it (black ink) and the tile turns black with the icon in the colour. */
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
        'relative inline-flex h-[var(--control-height-sm)] shrink-0 items-center justify-center gap-[var(--gap-sm)] rounded-sq-sm type-body-chip',
        'transition-[background-color,background-image,color,transform] duration-short4 ease-out-strong enabled:active:scale-[var(--press-scale)] motion-reduce:enabled:active:scale-100 focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed',
        iconOnly ? 'w-[var(--control-height-sm)]' : type === 'dropdown' ? 'pl-[var(--space-3)] pr-[var(--space-2-5)]' : 'px-[var(--space-3)]',
        type === 'map' && 'h-[var(--chip-height-map)] shadow-overlay',
        isSelected
          ? 'bg-ui-bg-inverse text-ui-fg-inverse enabled:hover:bg-[image:linear-gradient(var(--button-overlay-filled-hover),var(--button-overlay-filled-hover))] enabled:active:bg-[image:linear-gradient(var(--button-overlay-filled-pressed),var(--button-overlay-filled-pressed))]'
          : type === 'map'
            ? 'bg-map-ui-overlay text-ui-fg enabled:hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))]'
            : 'bg-control-fill text-ui-fg enabled:hover:bg-control-fill-hover',
        'disabled:text-ui-fg-disabled',
        isSelected && type !== 'map' ? 'disabled:bg-ui-bg-disabled' : 'disabled:bg-transparent',
        keyColor && 'pl-[var(--space-2)]',
        keyColor && isSelected && '!bg-[var(--chip-c)] !text-field-fg',
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {leadingIcon && keyColor ? (
        <span aria-hidden className={cn('inline-flex size-[var(--space-5)] shrink-0 rounded-[7px] p-[var(--space-1)] [&>svg]:size-full [&>svg]:[stroke-width:2.6]', isSelected ? 'bg-field-fg text-[var(--chip-c)]' : 'bg-[var(--chip-c)] text-field-fg')}>
          {leadingIcon}
        </span>
      ) : leadingIcon ? (
        <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] shrink-0 [&>svg]:size-full">
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
