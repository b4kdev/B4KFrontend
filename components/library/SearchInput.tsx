'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

// Search input (Figma Atoms › Search input): the field radius role, control fill with the resting
// shadow, the search mark in its role colours, a clear button once there is text. Focus = a 2px
// focus ring plus the float shadow. No visible label:
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
        'flex items-center gap-[var(--gap-sm)] rounded-field bg-control-fill pl-[var(--space-2)] pr-[var(--space-4)] text-ui-fg shadow-rest type-body-base',
        'transition-[box-shadow,background-color] duration-short4 ease-out-strong focus-within:shadow-[0_0_0_var(--focus-ring-width)_var(--color-border-focus),var(--shadow-float)]',
        size === 'lg' ? 'h-[var(--control-height-xl)]' : 'h-[var(--control-height-md)]',
        disabled && 'cursor-not-allowed bg-ui-bg-disabled text-ui-fg-disabled shadow-none',
        className,
      )}
    >
      <span aria-hidden className={cn('inline-flex size-[var(--space-8)] shrink-0 items-center justify-center rounded-full', disabled ? 'text-ui-fg-disabled' : 'bg-search-mark-bg text-search-mark-fg')}>
        <Search className="size-[18px]" strokeWidth={2.4} />
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
          className="relative inline-flex size-[var(--icon-size-lg)] shrink-0 items-center justify-center rounded-full bg-tile-surface-sunken text-ui-fg-muted hover:text-ui-fg before:absolute before:-inset-[var(--space-2-5)] before:content-['']"
        >
          <X aria-hidden className="size-[var(--icon-size-xs)]" />
        </button>
      ) : null}
    </div>
  )
})
