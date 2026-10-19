'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldMessage, Label } from './Field'
import { FIELD_FRAME } from './styles'

// Text input (UI-51, UI-58; Figma Atoms › Text input). Placeholder only by default; showLabel for
// longer forms (the label element is always there, sr-only when hidden). Sizes lg 44, md 40.
// Square, border-strong; focus = 2px border-focus, no ring. Error = danger border, message below
// (replaces help), aria-invalid. No success state.

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Figma Label. */
  label: string
  /** Figma Show label. */
  showLabel?: boolean
  size?: 'lg' | 'md'
  /** Figma Help text (Show help). */
  help?: ReactNode
  /** Figma Error text (State=Error). */
  error?: ReactNode
  /** Figma Show leading icon + Icon. */
  leadingIcon?: ReactNode
  /** Figma Show clear button: shown once there is a value. */
  onClear?: () => void
  /** Accessible name of the clear button, e.g. "Clear" from the messages. */
  clearLabel?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, showLabel = false, size = 'lg', help, error, leadingIcon, onClear, clearLabel, required, disabled, id, className, value, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const hasValue = value !== undefined && value !== ''
  return (
    <div className={cn('flex flex-col gap-[var(--space-1-5)]', className)}>
      <Label htmlFor={inputId} required={required} disabled={disabled} srOnly={!showLabel}>
        {label}
      </Label>
      <div
        className={cn(
          FIELD_FRAME,
          'flex items-center gap-[var(--gap-sm)] px-[var(--input-padding-x)]',
          size === 'lg' ? 'h-[var(--control-height-lg)]' : 'h-[var(--control-height-md)]',
          error && 'border-ui-danger-border hover:border-ui-danger-border focus-within:border-ui-danger-border',
          disabled && 'cursor-not-allowed border-ui-border-disabled bg-ui-bg-disabled text-ui-fg-disabled hover:border-ui-border-disabled',
        )}
      >
        {leadingIcon ? (
          <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted [&>svg]:size-full">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={help || error ? msgId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ui-fg-placeholder disabled:cursor-not-allowed disabled:placeholder:text-ui-fg-disabled"
          {...props}
        />
        {onClear && hasValue && !disabled ? (
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
      <FieldMessage id={msgId} help={help} error={error} disabled={disabled} />
    </div>
  )
})
