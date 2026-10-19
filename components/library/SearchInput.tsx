'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

// Search input (CMP-016; Figma Atoms › Search input): pill with a leading search icon, a clear
// button once there is text. Same states as Text input; focus = 2px border-focus. No visible label:
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
        'flex items-center gap-[var(--gap-sm)] rounded-full border border-ui-border-strong bg-ui-bg-raised px-[var(--space-4)] text-ui-fg type-body-base',
        'transition-colors duration-short4 ease-standard hover:border-ui-border-focus focus-within:border-[length:var(--border-width-2)] focus-within:border-ui-border-focus',
        size === 'lg' ? 'h-[var(--control-height-lg)]' : 'h-[var(--control-height-md)]',
        disabled && 'cursor-not-allowed border-ui-border-disabled bg-ui-bg-disabled text-ui-fg-disabled hover:border-ui-border-disabled',
        className,
      )}
    >
      <Search aria-hidden className={cn('size-[var(--icon-size-sm)] shrink-0', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')} />
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
          className="relative inline-flex size-[var(--icon-size-sm)] shrink-0 items-center justify-center text-ui-fg-muted hover:text-ui-fg before:absolute before:-inset-[14px] before:content-['']"
        >
          <X aria-hidden className="size-full" />
        </button>
      ) : null}
    </div>
  )
})
