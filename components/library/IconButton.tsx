import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { HIT_AREA, LIFT, PRESS } from './styles'

// Icon button (Figma Atoms › Icon button): 40 (control radius role, control/height-md), icon
// 20. Primary, Secondary, Ghost; states as Button. 44 tap area. Always needs an accessible name.

export const iconButtonVariants = cva(
  [
    'relative inline-flex size-[var(--control-height-md)] shrink-0 items-center justify-center rounded-control',
    PRESS,
    'focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed',
    '[&>svg]:size-[var(--icon-size-md)]',
    HIT_AREA,
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-button-primary-bg text-button-primary-fg shadow-accent',
          '[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:bg-button-primary-hover',
          'disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled disabled:shadow-none',
        ],
        secondary: [
          'bg-control-fill text-ui-fg',
          LIFT,
          '[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:bg-control-fill-hover',
          'aria-pressed:bg-accent-add aria-pressed:text-accent-add-fg',
          'disabled:bg-tile-surface-sunken disabled:text-ui-fg-disabled disabled:shadow-none disabled:opacity-[0.55]',
        ],
        // Floating over the map or a photo: the elevated surface with the float shadow.
        float: [
          'bg-ui-bg-elevated text-ui-fg shadow-float',
          '[@media(hover:hover)_and_(pointer:fine)]:enabled:hover:bg-control-fill-hover',
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
