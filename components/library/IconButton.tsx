import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { HIT_AREA } from './styles'

// Icon button (UI-50; Figma Atoms › Icon button): round 40 (radius/full, control/height-md), icon
// 20. Primary, Secondary, Ghost; states as Button. 44 tap area. Always needs an accessible name.

export const iconButtonVariants = cva(
  [
    'relative inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-full',
    'transition-[background-color,background-image,border-color,color] duration-short4 ease-standard',
    'focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed',
    '[&>svg]:size-[var(--icon-size-md)]',
    HIT_AREA,
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
          'border border-ui-border-strong text-ui-fg',
          'enabled:hover:bg-ui-state-hover enabled:active:bg-ui-state-pressed',
          'disabled:border-ui-border-disabled disabled:text-ui-fg-disabled',
        ],
        ghost: ['text-ui-fg', 'enabled:hover:bg-ui-state-hover enabled:active:bg-ui-state-pressed', 'disabled:text-ui-fg-disabled'],
      },
    },
    defaultVariants: { variant: 'ghost' },
  },
)

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> &
  VariantProps<typeof iconButtonVariants> & {
    /** Accessible name (required): the button has no visible text. */
    label: string
    /** Figma Icon: a Lucide icon element. */
    icon: ReactNode
  }

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant, label, icon, className, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} className={cn(iconButtonVariants({ variant }), className)} {...props}>
      {icon}
    </button>
  )
})
