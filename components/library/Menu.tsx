import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, Clock, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING_INSET } from './styles'

// Menu item (part of Dropdown menu, CMP-005) and Combobox option (part of Combobox, CMP-010).

export type MenuItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Variant=Danger: destructive action in the danger color. */
  variant?: 'default' | 'danger'
  /** Figma Show icon + Icon. */
  icon?: ReactNode
  /** Figma Checked (single-select menus): role menuitemradio. */
  checked?: boolean
  children: ReactNode
}

/** 44 high, optional leading icon, label, check mark when checked. */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { variant = 'default', icon, checked, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      className={cn(
        'flex h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] text-left type-body-base',
        'disabled:cursor-not-allowed disabled:text-ui-fg-disabled',
        variant === 'danger'
          ? 'text-ui-danger enabled:hover:bg-ui-danger-bg focus-visible:bg-ui-danger-bg'
          : 'text-ui-fg enabled:hover:bg-ui-state-hover focus-visible:bg-ui-state-hover',
        FOCUS_RING_INSET,
        className,
      )}
      {...props}
    >
      {icon ? <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] shrink-0 [&>svg]:size-full">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {checked ? <Check aria-hidden className="size-[var(--icon-size-sm)] shrink-0" /> : null}
    </button>
  )
})

export type ComboboxOptionProps = {
  id: string
  /** Figma Type: Recent (clock, past search, remove) or Place (type icon, title, secondary). */
  type: 'recent' | 'place'
  /** Title; for places the typed part is bolded with `match`. */
  title: string
  match?: string
  /** Figma Secondary (area, category). */
  secondary?: string
  icon?: ReactNode
  /** Figma State=Active (aria-activedescendant). */
  active?: boolean
  onSelect: () => void
  /** Recent: remove the entry (mouse; the Combobox maps Delete to it for keyboards). */
  onRemove?: () => void
  removeLabel?: string
}

function highlight(title: string, match?: string) {
  if (!match) return title
  const i = title.toLowerCase().indexOf(match.toLowerCase())
  if (i < 0) return title
  return (
    <>
      {title.slice(0, i)}
      <strong className="font-[var(--font-weight-semibold)]">{title.slice(i, i + match.length)}</strong>
      {title.slice(i + match.length)}
    </>
  )
}

/** Combobox option: 44 high minimum; active = state-hover fill. */
export function ComboboxOption({ id, type, title, match, secondary, icon, active, onSelect, onRemove, removeLabel }: ComboboxOptionProps) {
  return (
    <li
      role="none"
      className={cn('flex min-h-[var(--target-touch-min)] items-center pr-[var(--space-4)]', active ? 'bg-ui-state-hover' : 'hover:bg-ui-state-hover')}
    >
      <div
        id={id}
        role="option"
        aria-selected={active}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-[var(--space-3)] py-[var(--space-2)] pl-[var(--space-4)]"
      >
        <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted [&>svg]:size-full">
          {icon ?? (type === 'recent' ? <Clock /> : <MapPin />)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-0-5)]">
          <span className="truncate type-body-base text-ui-fg">{type === 'place' ? highlight(title, match) : title}</span>
          {secondary ? <span className="truncate type-body-caption text-ui-fg-muted">{secondary}</span> : null}
        </span>
      </div>
      {type === 'recent' && onRemove ? (
        // Mouse only: a listbox may hold options only. Keyboard users remove the active entry with
        // Delete (handled by the Combobox); removeLabel is the tooltip text.
        <span
          aria-hidden
          title={removeLabel}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          className="relative ml-[var(--space-3)] inline-flex size-[var(--icon-size-sm)] shrink-0 cursor-pointer items-center justify-center text-ui-fg-muted hover:text-ui-fg before:absolute before:-inset-[14px] before:content-['']"
        >
          <X className="size-full" />
        </span>
      ) : null}
    </li>
  )
}
