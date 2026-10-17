import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Badge (UI-54; Figma Atoms › Badge): a short non-interactive label, uppercase, badge/height,
// badge/padding-x. Strong = square, eyebrow/badge (featured, D-day). The others are pills with
// eyebrow/category. Critical uses the danger tokens, for errors only (UI-08).

export const badgeVariants = cva(
  'inline-flex h-[var(--badge-height)] shrink-0 items-center gap-[var(--space-1)] whitespace-nowrap px-[var(--badge-padding-x)] [&>svg]:size-[var(--icon-size-xs)]',
  {
    variants: {
      variant: {
        strong: 'rounded-none bg-ui-bg-inverse text-ui-fg-inverse type-eyebrow-badge',
        normal: 'rounded-full bg-ui-state-selected text-ui-fg type-eyebrow-category',
        inverse: 'rounded-full bg-ui-bg-inverse text-ui-fg-inverse type-eyebrow-category',
        outline: 'rounded-full border border-ui-border-strong text-ui-fg-muted type-eyebrow-category',
        'on-image': 'rounded-full bg-ui-scrim text-ui-fg-on-media type-eyebrow-category',
        critical: 'rounded-full border border-ui-danger-border bg-ui-danger-bg text-ui-danger type-eyebrow-category',
      },
    },
    defaultVariants: { variant: 'normal' },
  },
)

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  /** Figma Label. */
  children: ReactNode
  /** Figma Show leading icon + Icon. */
  leadingIcon?: ReactNode
  className?: string
}

export function Badge({ variant, children, leadingIcon, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {leadingIcon}
      {children}
    </span>
  )
}

export type CountBadgeProps = {
  /** Figma Type=Dot when left out. Shows 99+ above 99. */
  count?: number
  className?: string
}

/**
 * Count badge (UI-54): unread count or dot on an icon. Monochrome with a 2px color/bg outline.
 * Decorative: put the meaning on the parent (aria-label "Notifications, 3 unread").
 */
export function CountBadge({ count, className }: CountBadgeProps) {
  const dot = count === undefined
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full border-[length:var(--border-width-2)] border-ui-bg bg-ui-bg-inverse text-ui-fg-inverse',
        dot ? 'size-[var(--badge-dot-size)]' : 'h-[var(--badge-count-size)] min-w-[var(--badge-count-size)] px-[var(--space-1)] type-numeric-count',
        className,
      )}
    >
      {dot ? null : count! > 99 ? '99+' : count}
    </span>
  )
}
