'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { Minus, Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { FieldMessage } from './Field'
import { IconButton } from './IconButton'
import { ProgressBar } from './Progress'

// Form molecules (UI-63; Figma Molecules): Fieldset, Stepper, File upload.

export type FieldsetProps = {
  /** Legend (Label style). */
  legend: string
  /** Figma Hint (Show hint). */
  hint?: ReactNode
  /** Figma Error text (State=Error): once for the group. */
  error?: ReactNode
  disabled?: boolean
  /** Checkboxes or Radios. */
  children: ReactNode
  className?: string
}

export function Fieldset({ legend, hint, error, disabled, children, className }: FieldsetProps) {
  const id = useId()
  return (
    <fieldset disabled={disabled} aria-describedby={hint || error ? `${id}-msg` : undefined} aria-invalid={error ? true : undefined} className={cn('flex flex-col gap-[var(--space-1)]', className)}>
      <legend className={cn('mb-[var(--space-1)] type-body-label', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')}>{legend}</legend>
      {children}
      <FieldMessage id={`${id}-msg`} help={hint} error={error} />
    </fieldset>
  )
}

export type StepperProps = {
  /** Figma Label and Hint. */
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  onValueChange: (v: number) => void
  /** Accessible names, e.g. "Fewer days" / "More days". */
  decreaseLabel: string
  increaseLabel: string
  /** Formats the shown value, e.g. (n) => `${n} days`. */
  format?: (v: number) => string
  disabled?: boolean
  className?: string
}

/** Stepper (CMP-015, Backpack Nudger): label and hint left, − value + right. */
export function Stepper({ label, hint, value, min = 0, max = Infinity, onValueChange, decreaseLabel, increaseLabel, format, disabled, className }: StepperProps) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={`${id}-l`} className={cn('flex items-center justify-between gap-[var(--space-4)]', className)}>
      <div className="flex flex-col">
        <span id={`${id}-l`} className="type-body-base text-ui-fg">{label}</span>
        {hint ? <span className="type-body-caption text-ui-fg-muted">{hint}</span> : null}
      </div>
      <div className="flex items-center gap-[var(--space-3)]">
        <IconButton variant="secondary" label={decreaseLabel} icon={<Minus />} disabled={disabled || value <= min} onClick={() => onValueChange(Math.max(min, value - 1))} />
        <span aria-live="polite" className="min-w-[var(--space-8)] text-center type-body-base text-ui-fg tabular-nums">{format ? format(value) : value}</span>
        <IconButton variant="secondary" label={increaseLabel} icon={<Plus />} disabled={disabled || value >= max} onClick={() => onValueChange(Math.min(max, value + 1))} />
      </div>
    </div>
  )
}

export type FileUploadProps = {
  /** Figma Type. */
  type?: 'button' | 'drop-zone'
  /** Button label, e.g. "Upload photo"; drop zone line, e.g. "Drop a photo here or browse". */
  label: string
  hint?: ReactNode
  error?: ReactNode
  accept?: string
  onFile: (file: File) => void
  /** Figma State=Uploading: 0 to 100. */
  progress?: number
  progressLabel?: string
  className?: string
}

/** File upload (CMP-020): a hidden file input opened by the button; the zone also takes drops. */
export function FileUpload({ type = 'button', label, hint, error, accept, onFile, progress, progressLabel, className }: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [over, setOver] = useState(false)
  const pick = (files: FileList | null) => files?.[0] && onFile(files[0])
  const field = <input ref={input} id={id} type="file" accept={accept} className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files)} />
  const status =
    progress !== undefined ? <ProgressBar value={progress} label={progressLabel ?? label} /> : <FieldMessage id={`${id}-msg`} help={hint} error={error} />
  if (type === 'button') {
    return (
      <div className={cn('flex flex-col items-start gap-[var(--space-2)]', className)}>
        {field}
        <Button variant="secondary" size="md" leadingIcon={<Upload />} onClick={() => input.current?.click()} aria-describedby={`${id}-msg`}>
          {label}
        </Button>
        {status}
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      {field}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          pick(e.dataTransfer.files)
        }}
        aria-describedby={`${id}-msg`}
        className={cn(
          'flex min-h-[calc(var(--space-24)+var(--space-8))] w-full flex-col items-center justify-center gap-[var(--space-2)] px-[var(--space-6)] type-body-base text-ui-fg-muted',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          over ? 'border-[length:var(--border-width-2)] border-solid border-ui-border-focus bg-ui-state-hover' : 'border border-dashed border-ui-border-strong hover:bg-ui-state-hover',
          error && 'border-ui-danger-border',
        )}
      >
        <Upload aria-hidden className="size-[var(--icon-size-lg)]" />
        {label}
      </button>
      {status}
    </div>
  )
}
