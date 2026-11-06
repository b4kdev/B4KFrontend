'use client'

import { cloneElement, useEffect, useId, useState, type ReactElement } from 'react'
import { cn } from '@/lib/cn'

// Tooltip (Figma Atoms › Tooltip): short help text for a control on hover and keyboard focus
// (role tooltip, aria-describedby), closed with Esc. Inverse, radius xs, no arrow, no shadow; 8 below
// the trigger by default; wraps at tooltip/max-width, body/caption. Never the only place for
// essential information (no tooltips on touch).
// Placement is CSS-only for now (centered below or above the trigger, or beside it on the right); a collision-aware version
// (Floating UI) can replace it without changing the props.

export type TooltipProps = {
  /** Figma Text. */
  text: string
  /** right: beside the trigger, vertically centred (the navigation rail, where a label below clips at the window edge). */
  side?: 'bottom' | 'top' | 'right'
  /** The trigger: one focusable element. */
  children: ReactElement<React.HTMLAttributes<HTMLElement>>
  className?: string
  /** Class for the wrapper around the trigger (e.g. full width in the rail). */
  wrapperClassName?: string
}

export function Tooltip({ text, side = 'bottom', children, className, wrapperClassName }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <span
      className={cn('relative inline-flex', wrapperClassName)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-[var(--tooltip-max-width)] rounded-sq-xs bg-ui-bg-inverse px-[var(--space-3)] py-[var(--space-2)] type-body-caption font-[var(--font-weight-semibold)] text-ui-fg-inverse',
          side === 'right' ? 'left-[calc(100%+var(--space-2))] top-1/2 -translate-y-1/2' : 'left-1/2 -translate-x-1/2',
          side === 'bottom' ? 'top-[calc(100%+var(--space-2))]' : side === 'top' ? 'bottom-[calc(100%+var(--space-2))]' : null,
          open ? 'visible opacity-100' : 'invisible opacity-0',
          'transition-opacity duration-short3 ease-standard',
          className,
        )}
      >
        {text}
      </span>
    </span>
  )
}
