import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'

// Toast (Figma B4K UI Components › Molecules › Toast): a short message after an action,
// inverse surface (bg-inverse, fg-inverse), radius/2xl, no shadow. A monochrome icon per
// type; Critical is told apart by its icon and uses role alert. One optional action
// (Undo, Retry) and a close button.
// Placement, one-at-a-time, the 4 s timer (none with an action or for Critical) and pause on hover
// and focus belong to the toast region that shows it, not to this component.

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, critical: CircleAlert } as const

export type ToastProps = {
  /** Figma Type. */
  type?: keyof typeof ICONS
  /** Figma Message. */
  message: React.ReactNode
  /** Figma Show action + its label. */
  action?: { label: string; onClick: () => void }
  /** Figma Show close. Needs closeLabel. */
  onClose?: () => void
  /** Accessible name of the close button, e.g. "Close" from the messages. */
  closeLabel?: string
  className?: string
}

export function Toast({ type = 'info', message, action, onClose, closeLabel, className }: ToastProps) {
  const Icon = ICONS[type]
  return (
    <div
      role={type === 'critical' ? 'alert' : 'status'}
      className={cn(
        'flex w-full max-w-[360px] items-center gap-[var(--space-3)] rounded-2xl bg-ui-bg-inverse text-ui-fg-inverse',
        'min-h-[var(--control-height-xl)] py-[var(--space-1)] pl-[var(--space-4)] pr-[var(--space-2)]',
        className,
      )}
    >
      <Icon aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
      <p className="min-w-0 flex-1 type-body-base">{message}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="h-[var(--target-touch-min)] shrink-0 px-[var(--space-2)] type-label-button hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none"
        >
          {action.label}
        </button>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-full hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none"
        >
          <X aria-hidden className="size-[var(--icon-size-sm)]" />
        </button>
      ) : null}
    </div>
  )
}
