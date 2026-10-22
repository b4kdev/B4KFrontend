import { cn } from '@/lib/cn'

// Skip link (Figma B4K UI Components › Atoms › Skip link): the first focusable
// element on every page. Hidden until focused, then shown top-left (space/4 from the edges) with
// the focus ring; jumps to the main landmark (give <main> the matching id).

export type SkipLinkProps = {
  /** Target id of the main landmark, without #. */
  targetId?: string
  /** Figma Label, e.g. "Skip to main content" from the messages. */
  children: React.ReactNode
  className?: string
}

export function SkipLink({ targetId = 'main', children, className }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only bg-ui-bg-inverse px-[var(--space-4)] py-[var(--space-3)] type-body-label text-ui-fg-inverse',
        'focus:not-sr-only focus:fixed focus:left-[var(--space-4)] focus:top-[var(--space-4)] focus:z-50',
        'focus:outline focus:outline-[length:var(--focus-ring-width)] focus:outline-offset-[var(--focus-ring-offset)] focus:outline-ui-border-focus',
        className,
      )}
    >
      {children}
    </a>
  )
}
