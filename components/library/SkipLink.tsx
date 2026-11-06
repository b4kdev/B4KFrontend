'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

// Skip link (Figma B4K UI Components › Atoms › Skip link): the first focusable
// element on every page. Hidden until focused from the keyboard (:focus-visible; the router also
// focuses it after a page change, which must not show it to mouse and touch users; on a fresh load
// such as the return from a sign-in no pointer has been used yet and the browser counts that focus as
// keyboard focus, so it shows only after a Tab press), then shown top-left (space/4 from the edges) with
// the focus ring; jumps to the main landmark (give <main> the matching id).

export type SkipLinkProps = {
  /** Target id of the main landmark, without #. */
  targetId?: string
  /** Figma Label, e.g. "Skip to main content" from the messages. */
  children: React.ReactNode
  className?: string
}

export function SkipLink({ targetId = 'main', children, className }: SkipLinkProps) {
  const [kbd, setKbd] = useState(false)
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Tab' && setKbd(true)
    const pointer = () => setKbd(false)
    window.addEventListener('keydown', key, true)
    window.addEventListener('pointerdown', pointer, true)
    return () => {
      window.removeEventListener('keydown', key, true)
      window.removeEventListener('pointerdown', pointer, true)
    }
  }, [])
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // sr-only and not-sr-only both reset padding, so the padding sits on the label span inside.
        'sr-only bg-ui-bg-inverse type-body-label text-ui-fg-inverse',
        kbd &&
          'focus-visible:not-sr-only focus-visible:fixed focus-visible:left-[var(--space-4)] focus-visible:top-[var(--space-4)] focus-visible:z-50',
        kbd &&
          'focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus',
        className,
      )}
    >
      <span className="block px-[var(--space-4)] py-[var(--space-3)]">{children}</span>
    </a>
  )
}
