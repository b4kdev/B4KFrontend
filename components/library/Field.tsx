import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

// Label and the help / error row shared by Text input, Select and Textarea.

export type LabelProps = {
  htmlFor?: string
  /** Figma Text. */
  children: React.ReactNode
  /** Figma Required: muted asterisk. */
  required?: boolean
  /** Figma State=Disabled. */
  disabled?: boolean
  /** Placeholder-only fields still render the label for screen readers. */
  srOnly?: boolean
  className?: string
}

export function Label({ htmlFor, children, required, disabled, srOnly, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'inline-flex gap-[var(--space-1)] type-body-label',
        disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted',
        srOnly && 'sr-only',
        className,
      )}
    >
      {children}
      {required ? <span aria-hidden>*</span> : null}
    </label>
  )
}

export type FieldMessageProps = {
  id: string
  help?: React.ReactNode
  error?: React.ReactNode
  /** Figma State=Disabled: help in fg-disabled. */
  disabled?: boolean
  /** Fieldset (Figma Molecules › Fieldset): the hint stays and the error shows below it. */
  stacked?: boolean
}

/** Help text, replaced by the error message when there is one (body/caption). */
export function FieldMessage({ id, help, error, disabled, stacked }: FieldMessageProps) {
  const helpClass = cn('type-body-caption', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')
  if (stacked) {
    if (!help && !error) return null
    return (
      <div id={id} className="flex flex-col gap-[var(--space-1)]">
        {help ? <p className={helpClass}>{help}</p> : null}
        {error ? (
          <p className="flex items-center gap-[var(--space-1-5)] type-body-caption text-ui-danger">
            <CircleAlert aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    )
  }
  if (error) {
    return (
      <p id={id} className="flex items-start gap-[var(--space-1-5)] type-body-caption text-ui-danger">
        <CircleAlert aria-hidden className="mt-[var(--space-0-5)] size-[var(--icon-size-xs)] shrink-0" />
        {error}
      </p>
    )
  }
  if (help) return <p id={id} className={helpClass}>{help}</p>
  return null
}
