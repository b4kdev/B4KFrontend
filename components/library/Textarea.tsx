'use client'

import { forwardRef, useCallback, useId, useLayoutEffect, useRef, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { FieldMessage, Label } from './Field'
import { FIELD_FRAME } from './styles'

// Textarea (UI-59; Figma Atoms › Textarea): same look and states as Text input. Starts at 3 rows
// (textarea/min-height), grows with the text to 8 rows, then scrolls; no resize handle.
// Optional counter on the help row, announced politely.

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  showLabel?: boolean
  help?: ReactNode
  error?: ReactNode
  /** Figma Show counter: shows length / maxLength. */
  showCounter?: boolean
}

const MAX_ROWS = 8

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, showLabel = false, help, error, showCounter, required, disabled, id, className, value, maxLength, onChange, ...props },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  const msgId = `${areaId}-msg`
  const inner = useRef<HTMLTextAreaElement | null>(null)
  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      inner.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    el.style.height = 'auto'
    const line = parseFloat(getComputedStyle(el).lineHeight) || 21
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_ROWS + 24)}px`
  }, [value])
  const length = typeof value === 'string' ? value.length : 0
  const counter =
    showCounter && maxLength ? (
      <p
        aria-live={length > maxLength * 0.9 ? 'polite' : 'off'}
        className={cn('shrink-0 type-body-caption', !error && 'ml-auto', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')}
      >
        {length} / {maxLength}
      </p>
    ) : null
  return (
    <div className={cn('flex flex-col gap-[var(--space-1-5)]', className)}>
      <Label htmlFor={areaId} required={required} disabled={disabled} srOnly={!showLabel}>
        {label}
      </Label>
      <div
        className={cn(
          FIELD_FRAME,
          'flex px-[var(--input-padding-x)] py-[var(--space-2-5)]',
          error && 'border-ui-danger-border hover:border-ui-danger-border focus-within:border-ui-danger-border',
          disabled && 'cursor-not-allowed border-ui-border-disabled bg-ui-bg-disabled text-ui-fg-disabled hover:border-ui-border-disabled',
        )}
      >
        <textarea
          ref={setRefs}
          id={areaId}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={help || error || showCounter ? msgId : undefined}
          className="min-h-[calc(var(--textarea-min-height)-2*var(--space-2-5)-2*var(--border-width-1))] w-full resize-none bg-transparent outline-none placeholder:text-ui-fg-placeholder disabled:cursor-not-allowed disabled:placeholder:text-ui-fg-disabled"
          {...props}
        />
      </div>
      {/* Help and counter share a row; with an error the counter gets its own row above the message. */}
      {error ? (
        <>
          {counter}
          <FieldMessage id={msgId} help={help} error={error} disabled={disabled} />
        </>
      ) : (
        <div className="flex items-start justify-between gap-[var(--space-2)]">
          <FieldMessage id={msgId} help={help} error={error} disabled={disabled} />
          {counter}
        </div>
      )}
    </div>
  )
})
