import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

// Button (Figma B4K UI Components › Atoms › Button).
// Variant: Primary (filled inverse), Secondary (control fill), Ghost (text only), Danger (destructive).
// Squircle (radius md), sentence-case label, press scale 0.97.
// Size: 2xl 52 (hero), xl 48 (panels), lg 44 (default), md 40, sm 32; md and sm keep a 44 tap area (target/touch-min).
// Focus: keyboard only, focus/ring. One primary action per view.
// Loading: the label stays (transparent, still read out) so the width does not change, a Spinner sm is centered on
// top, taps are ignored (aria-busy, aria-disabled, no pointer events) and the accessible name stays.

export const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-sq-md',
    'gap-[var(--gap-sm)] px-[var(--button-padding-x)] type-label-button',
    'transition-[background-color,background-image,border-color,color,transform] duration-short4 ease-out-strong enabled:active:scale-[var(--press-scale)] motion-reduce:enabled:active:scale-100',
    'focus-visible:shadow-focus-ring focus-visible:outline-none',
    "before:absolute before:inset-x-0 before:top-1/2 before:h-[max(100%,var(--target-touch-min))] before:-translate-y-1/2 before:content-['']",
    'disabled:cursor-not-allowed aria-busy:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-ui-bg-inverse text-ui-fg-inverse',
          'enabled:hover:bg-[image:linear-gradient(var(--button-overlay-filled-hover),var(--button-overlay-filled-hover))]',
          'enabled:active:bg-[image:linear-gradient(var(--button-overlay-filled-pressed),var(--button-overlay-filled-pressed))]',
          'disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled',
        ],
        secondary: [
          'bg-control-fill text-ui-fg',
          'enabled:hover:bg-control-fill-hover',
          'disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled',
        ],
        ghost: [
          'text-ui-fg',
          'enabled:hover:bg-ui-state-hover',
          'enabled:active:bg-ui-state-pressed',
          'disabled:text-ui-fg-disabled',
        ],
        danger: [
          'bg-ui-danger text-ui-fg-inverse',
          'enabled:hover:bg-[image:linear-gradient(var(--button-overlay-filled-hover),var(--button-overlay-filled-hover))]',
          'enabled:active:bg-[image:linear-gradient(var(--button-overlay-filled-pressed),var(--button-overlay-filled-pressed))]',
          'disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled',
        ],
      },
      size: {
        '2xl': 'h-[var(--control-height-2xl)] px-[var(--space-7)] text-base',
        xl: 'h-[var(--control-height-xl)]',
        lg: 'h-[var(--control-height-lg)]',
        md: 'h-[var(--control-height-md)]',
        sm: 'h-[var(--control-height-sm)]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'lg' },
  },
)

/** The hover and press fills of a Button variant for a link styled as a button (`enabled:` never
 * matches an <a>, so the button's own hover classes do not fire on links). */
const LINK_STATES: Record<'primary' | 'secondary' | 'ghost', string> = {
  primary: 'hover:bg-[image:linear-gradient(var(--button-overlay-filled-hover),var(--button-overlay-filled-hover))] active:bg-[image:linear-gradient(var(--button-overlay-filled-pressed),var(--button-overlay-filled-pressed))] active:scale-[var(--press-scale)] motion-reduce:active:scale-100',
  secondary: 'hover:bg-control-fill-hover active:scale-[var(--press-scale)] motion-reduce:active:scale-100',
  ghost: 'hover:bg-ui-state-hover active:bg-ui-state-pressed active:scale-[var(--press-scale)] motion-reduce:active:scale-100',
}

/** Classes for a link that looks like a Button: same shape, fill and label, with link hover and press. */
export function linkButtonVariants({ variant = 'primary', size = 'lg' }: { variant?: 'primary' | 'secondary' | 'ghost'; size?: VariantProps<typeof buttonVariants>['size'] } = {}) {
  return cn(buttonVariants({ variant, size }), LINK_STATES[variant])
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Figma "Show leading icon" + "Icon": a Lucide icon element, e.g. <Plus />. */
    leadingIcon?: ReactNode
    /** Figma State=loading. */
    loading?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, leadingIcon, loading = false, className, children, type = 'button', onClick, ...props },
  ref,
) {
  const filled = variant === undefined || variant === null || variant === 'primary' || variant === 'danger'
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || props.disabled || undefined}
      // Keyboard activation and Enter in a form field still fire click on a submit button, so a
      // loading button cancels it (no double submit) instead of only dropping the handler.
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <span className={cn('inline-flex items-center gap-[var(--gap-sm)]', loading && 'opacity-0')}>
        {leadingIcon ? (
          <span aria-hidden className="inline-flex size-[var(--icon-size-sm)] [&>svg]:size-full">
            {leadingIcon}
          </span>
        ) : null}
        {children}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" tone={filled ? 'inverse' : 'default'} />
        </span>
      ) : null}
    </button>
  )
})
