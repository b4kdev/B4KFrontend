import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

// FAB (UI-62; Figma Atoms › FAB): the floating AI launcher on the map. Icon = 56 circle (fab/size),
// bg-inverse, sparkles; Extended = same height with the label (Ask AI). No shadow (UI-05).
// Open (AI panel open) = bg-raised with border-strong. One per screen.

export type FabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Type. */
  type?: 'icon' | 'extended'
  /** Figma Label: visible on Extended, the accessible name on Icon. */
  label: string
  /** Figma State=Open. */
  open?: boolean
  icon?: React.ReactNode
}

export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { type = 'icon', label, open = false, icon, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={type === 'icon' ? label : undefined}
      aria-expanded={open}
      className={cn(
        'inline-flex h-[var(--fab-size)] shrink-0 items-center justify-center gap-[var(--gap-sm)] rounded-full',
        'transition-[background-color,background-image] duration-short4 ease-standard focus-visible:shadow-focus-ring focus-visible:outline-none',
        type === 'icon' ? 'w-[var(--fab-size)]' : 'pl-[var(--space-5)] pr-[var(--space-6)] type-label-button',
        open
          ? 'border border-ui-border-strong bg-ui-bg-raised text-ui-fg hover:bg-ui-state-hover'
          : 'bg-ui-bg-inverse text-ui-fg-inverse hover:bg-[image:linear-gradient(var(--button-overlay-filled-hover),var(--button-overlay-filled-hover))] active:bg-[image:linear-gradient(var(--button-overlay-filled-pressed),var(--button-overlay-filled-pressed))]',
        '[&>svg]:size-[var(--icon-size-lg)]',
        className,
      )}
      {...props}
    >
      {icon ?? <Sparkles aria-hidden />}
      {type === 'extended' ? label : null}
    </button>
  )
})
