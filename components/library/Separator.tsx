import { cn } from '@/lib/cn'

// Separator (UI-60; Figma B4K UI Components › Atoms › Separator): 1px color/border, dividers only.
// Horizontal stretches to its container, Vertical takes the height of its row, With text is the
// "or" divider (eyebrow/category). Decorative by default (hidden from screen readers); pass
// decorative={false} for a real section break (hr).

export type SeparatorProps = {
  /** Figma Orientation. */
  orientation?: 'horizontal' | 'vertical' | 'with-text'
  /** Figma Text, for orientation "with-text". */
  text?: string
  decorative?: boolean
  className?: string
}

export function Separator({ orientation = 'horizontal', text, decorative = true, className }: SeparatorProps) {
  if (orientation === 'with-text') {
    return (
      <div
        role={decorative ? 'none' : 'separator'}
        className={cn('flex items-center gap-[var(--space-3)]', className)}
      >
        <span aria-hidden className="h-px flex-1 bg-ui-border" />
        <span className="type-eyebrow-category text-ui-fg-muted">{text}</span>
        <span aria-hidden className="h-px flex-1 bg-ui-border" />
      </div>
    )
  }
  if (orientation === 'vertical') {
    return (
      <span
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : 'vertical'}
        className={cn('inline-block w-px self-stretch bg-ui-border', className)}
      />
    )
  }
  return decorative ? (
    <div role="none" className={cn('h-px w-full bg-ui-border', className)} />
  ) : (
    <hr className={cn('h-px w-full border-0 bg-ui-border', className)} />
  )
}
