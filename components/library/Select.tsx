'use client'

import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldMessage, Label } from './Field'
import { FIELD_FRAME } from './styles'

// Select (UI-59; Figma Atoms › Select): a styled native select (phones open their own picker),
// same look and states as Text input. Chevron at the end; the placeholder shows when nothing is chosen.

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label: string
  showLabel?: boolean
  size?: 'lg' | 'md'
  /** Figma Placeholder: a first, empty option. */
  placeholder?: string
  help?: ReactNode
  error?: ReactNode
  leadingIcon?: ReactNode
  children: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, showLabel = false, size = 'lg', placeholder, help, error, leadingIcon, required, disabled, id, className, children, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const msgId = `${selectId}-msg`
  return (
    <div className={cn('flex flex-col gap-[var(--space-1-5)]', className)}>
      <Label htmlFor={selectId} required={required} disabled={disabled} srOnly={!showLabel}>
        {label}
      </Label>
      <div
        className={cn(
          FIELD_FRAME,
          'relative flex items-center gap-[var(--gap-sm)] px-[var(--input-padding-x)]',
          size === 'lg' ? 'h-[var(--control-height-lg)]' : 'h-[var(--control-height-md)]',
          error && 'border-ui-danger-border hover:border-ui-danger-border focus-within:border-ui-danger-border',
          disabled && 'cursor-not-allowed border-ui-border-disabled text-ui-fg-disabled hover:border-ui-border-disabled',
        )}
      >
        {leadingIcon ? (
          <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted [&>svg]:size-full">
            {leadingIcon}
          </span>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={help || error ? msgId : undefined}
          className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-[var(--space-6)] outline-none disabled:cursor-not-allowed invalid:text-ui-fg-placeholder"
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-[var(--input-padding-x)] size-[var(--icon-size-sm)] text-ui-fg-muted" />
      </div>
      <FieldMessage id={msgId} help={help} error={error} />
    </div>
  )
})
