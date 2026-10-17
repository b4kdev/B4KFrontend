'use client'

import { forwardRef, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'

// Checkbox, Radio, Toggle (UI-52; Figma Atoms). Native inputs with their label; the whole row is
// at least 44 high so the label is part of the target. Focus = ring around the box (UI-15).

const ROW = 'group relative inline-flex min-h-[var(--target-touch-min)] cursor-pointer items-center gap-[var(--gap-sm)] type-body-base text-ui-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:text-ui-fg-disabled'
const BOX_FOCUS = 'peer-focus-visible:shadow-focus-ring'

type ChoiceBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Figma Label. */
  label: ReactNode
  /** Figma Show label=false: the label stays for screen readers. */
  hideLabel?: boolean
}

export type CheckboxProps = ChoiceBase & {
  /** Figma Value=Indeterminate. */
  indeterminate?: boolean
  /** Figma State=Error (e.g. required terms); the message comes from Fieldset. */
  invalid?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hideLabel, indeterminate = false, invalid, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inner = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <label htmlFor={id ?? autoId} className={cn(ROW, className)}>
      <input
        ref={(el) => {
          inner.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        id={id ?? autoId}
        type="checkbox"
        aria-invalid={invalid || undefined}
        aria-checked={indeterminate ? 'mixed' : undefined}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          'inline-flex size-[var(--control-box-size)] shrink-0 items-center justify-center rounded-none border-[length:var(--border-width-1-5)] border-ui-border-strong text-ui-fg-inverse',
          'group-hover:bg-ui-state-hover peer-checked:border-ui-bg-inverse peer-checked:bg-ui-bg-inverse',
          indeterminate && 'border-ui-bg-inverse bg-ui-bg-inverse',
          invalid && 'border-ui-danger-border',
          'peer-disabled:border-ui-border-disabled peer-disabled:bg-transparent peer-disabled:text-ui-fg-disabled peer-checked:peer-disabled:bg-ui-bg-disabled',
          BOX_FOCUS,
          '[&>svg]:hidden peer-checked:[&>svg.check]:block',
          indeterminate && '[&>svg.minus]:block peer-checked:[&>svg.check]:hidden',
        )}
      >
        <Check className="check size-[var(--icon-size-sm)]" strokeWidth={3} />
        <Minus className="minus size-[var(--icon-size-sm)]" strokeWidth={3} />
      </span>
      <span className={cn(hideLabel && 'sr-only')}>{label}</span>
    </label>
  )
})

export type RadioProps = ChoiceBase

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, hideLabel, className, id, ...props },
  ref,
) {
  const autoId = useId()
  return (
    <label htmlFor={id ?? autoId} className={cn(ROW, className)}>
      <input ref={ref} id={id ?? autoId} type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          'inline-flex size-[var(--control-box-size)] shrink-0 items-center justify-center rounded-full border-[length:var(--border-width-1-5)] border-ui-border-strong',
          'group-hover:bg-ui-state-hover peer-checked:border-ui-bg-inverse peer-checked:bg-ui-bg-inverse',
          'peer-disabled:border-ui-border-disabled peer-disabled:bg-transparent peer-checked:peer-disabled:bg-ui-bg-disabled',
          BOX_FOCUS,
          '[&>span]:hidden peer-checked:[&>span]:block',
        )}
      >
        <span className="size-[var(--radio-dot-size)] rounded-full bg-ui-fg-inverse" />
      </span>
      <span className={cn(hideLabel && 'sr-only')}>{label}</span>
    </label>
  )
})

export type ToggleProps = {
  /** Figma Label (before the track). */
  label: ReactNode
  hideLabel?: boolean
  /** Figma Value=On. */
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

/** Toggle: a switch that applies at once (no Save button). */
export function Toggle({ label, hideLabel, checked, onCheckedChange, disabled, className, id }: ToggleProps) {
  const autoId = useId()
  const labelId = `${id ?? autoId}-label`
  return (
    <div className={cn('inline-flex min-h-[var(--target-touch-min)] items-center gap-[var(--gap-sm)] type-body-base', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg', className)}>
      <span id={labelId} className={cn(hideLabel && 'sr-only')}>{label}</span>
      <button
        id={id ?? autoId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-[var(--toggle-track-height)] w-[var(--toggle-track-width)] shrink-0 items-center rounded-full px-[var(--space-0-5)]',
          'transition-colors duration-short4 ease-standard focus-visible:shadow-focus-ring focus-visible:outline-none',
          "before:absolute before:inset-x-0 before:top-1/2 before:h-[var(--target-touch-min)] before:-translate-y-1/2 before:content-['']",
          checked ? 'bg-ui-bg-inverse' : 'border border-ui-border-strong hover:bg-ui-state-hover',
          disabled && (checked ? 'bg-ui-bg-disabled' : 'border-ui-border-disabled'),
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'size-[var(--toggle-knob-size)] rounded-full transition-transform duration-short4 ease-standard motion-reduce:transition-none',
            checked ? 'translate-x-[calc(var(--toggle-track-width)-var(--toggle-knob-size)-var(--space-1))] bg-ui-fg-inverse' : '-translate-x-[1px] bg-ui-fg',
            disabled && 'bg-ui-fg-disabled',
          )}
        />
      </button>
    </div>
  )
}
