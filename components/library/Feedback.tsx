import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, SearchX, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, HIT_AREA } from './styles'

// Feedback molecules (UI-68; Figma Molecules): Alert, Empty state. (Toast: Toast.tsx.)

const ALERT_ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, critical: CircleAlert } as const

export type AlertProps = {
  /** Figma Type. */
  type?: keyof typeof ALERT_ICON
  /** Figma Show title. */
  title?: ReactNode
  children: ReactNode
  /** Figma Show action: a Link. */
  action?: ReactNode
  /** Figma Dismissible: needs dismissLabel. */
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

/**
 * Alert (CMP-027): persistent inline message, square. Info, Success, Warning: bg-raised, 1px border,
 * told apart by icon (UI-10). Critical: danger-bg, danger-border, danger icon (UI-08), role alert.
 */
export function Alert({ type = 'info', title, children, action, onDismiss, dismissLabel, className }: AlertProps) {
  const Icon = ALERT_ICON[type]
  const critical = type === 'critical'
  return (
    <div
      role={critical ? 'alert' : 'status'}
      className={cn(
        'flex gap-[var(--space-3)] rounded-none border pb-[var(--space-4)] pl-[var(--space-4)] pr-[var(--space-3)] pt-[var(--space-3)]',
        critical ? 'border-ui-danger-border bg-ui-danger-bg' : 'border-ui-border bg-ui-bg-raised',
        className,
      )}
    >
      <span aria-hidden className="inline-flex shrink-0 pt-[var(--space-1)]">
        <Icon className={cn('size-[var(--icon-size-md)]', critical ? 'text-ui-danger' : 'text-ui-fg')} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)] pt-[var(--space-1)]">
        {title ? <p className="type-title-card text-ui-fg">{title}</p> : null}
        <div className="type-body-base text-ui-fg-muted">{children}</div>
        {action ? <div className="mt-[var(--space-1)]">{action}</div> : null}
      </div>
      {onDismiss ? (
        // Figma Dismissible: a bare 16 x, top right; the 44 tap area comes from HIT_AREA.
        <button
          type="button"
          aria-label={dismissLabel ?? ''}
          onClick={onDismiss}
          className={cn('relative inline-flex shrink-0 self-start text-ui-fg', FOCUS_RING, HIT_AREA)}
        >
          <X aria-hidden className="size-[var(--icon-size-sm)]" />
        </button>
      ) : null}
    </div>
  )
}

const EMPTY_ICON = { empty: Info, 'no-results': SearchX, error: CircleAlert } as const

export type EmptyStateProps = {
  /** Figma Type. */
  type?: keyof typeof EMPTY_ICON
  /** Figma Container. */
  container?: 'bordered' | 'plain'
  /** Large Lucide icon; defaults by type. */
  icon?: ReactNode
  title: ReactNode
  /** One line of body text. */
  children?: ReactNode
  /** Figma Show action: a Button. */
  action?: ReactNode
  /** The title element: a heading when the state is the whole page (Page not found). */
  titleAs?: 'p' | 'h1' | 'h2'
  className?: string
}

/** Empty state (CMP-035): icon, title/empty-state, one line, optional Button. Error uses role alert. */
export function EmptyState({ type = 'empty', container = 'plain', icon, title, children, action, titleAs: Title = 'p', className }: EmptyStateProps) {
  const Icon = EMPTY_ICON[type]
  return (
    <div
      role={type === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-12)] text-center',
        container === 'bordered' && 'border border-ui-border bg-ui-bg-raised',
        className,
      )}
    >
      <span aria-hidden className={cn('mb-[var(--space-4)] inline-flex size-[var(--icon-size-2xl)] [&>svg]:size-full', type === 'error' ? 'text-ui-danger' : 'text-ui-fg-muted')}>
        {icon ?? <Icon />}
      </span>
      <Title className="type-title-empty-state text-ui-fg">{title}</Title>
      {/* Figma body: 320 fixed, never wider than the container. */}
      {children ? <p className="w-[320px] max-w-full type-body-base text-ui-fg-muted">{children}</p> : null}
      {action ? <div className="mt-[var(--space-4)]">{action}</div> : null}
    </div>
  )
}
