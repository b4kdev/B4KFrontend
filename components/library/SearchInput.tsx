'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

// Search input (Figma Atoms › Search input): a 48 squircle (radius lg) on the raised fill with the
// search glyph tile (the search accent, black icon) at its start, a clear button once there is text.
// Focus = 1.5px border-focus and the elevated fill. No visible label:
// type search with an aria-label. Suggestions open in a Combobox.

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  /** Accessible name, e.g. "Search places and plans". */
  label: string
  size?: 'lg' | 'md'
  onClear?: () => void
  clearLabel?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, size = 'lg', onClear, clearLabel, value, disabled, className, ...props },
  ref,
) {
  const hasValue = value !== undefined && value !== ''
  return (
    <div
      className={cn(
        'flex items-center gap-[var(--gap-sm)] rounded-sq-lg border-[length:var(--border-width-1-5)] border-ui-border bg-ui-bg-raised dark:border-transparent pl-[var(--space-2)] pr-[var(--space-4)] text-ui-fg type-body-base [&_input]:text-[length:calc(var(--font-size-base)-var(--border-width-1))]',
        'transition-[border-color,background-color] duration-short4 ease-out-strong focus-within:border-ui-border-focus focus-within:bg-ui-bg-elevated',
        size === 'lg' ? 'h-[var(--control-height-xl)]' : 'h-[var(--control-height-md)] pl-[var(--space-1)]',
        disabled && 'cursor-not-allowed border-ui-border-disabled bg-ui-bg-disabled text-ui-fg-disabled hover:border-ui-border-disabled',
        className,
      )}
    >
      <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-sq-sm p-[var(--space-1-5)]', size === 'lg' ? 'size-[var(--control-height-sm)]' : 'size-[var(--control-height-xs)]', disabled ? 'bg-control-fill text-ui-fg-disabled' : 'bg-accent-search text-field-fg')}>
        <Search className="size-full [stroke-width:2.6]" />
      </span>
      <input
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        disabled={disabled}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ui-fg-placeholder disabled:cursor-not-allowed disabled:placeholder:text-ui-fg-disabled [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {onClear && hasValue ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className="relative inline-flex size-[var(--icon-size-sm)] shrink-0 items-center justify-center text-ui-fg-muted hover:text-ui-fg before:absolute before:-inset-[var(--space-3-5)] before:content-['']"
        >
          <X aria-hidden className="size-full" />
        </button>
      ) : null}
    </div>
  )
})
