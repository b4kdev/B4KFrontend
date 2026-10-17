import { cn } from '@/lib/cn'

// Spinner (UI-56, Figma B4K UI Components › Atoms › Spinner): a color/fg quarter arc turning on a
// color/state-selected track, border-width/2. One turn per duration/long4, linear; slower under
// reduced motion (it still shows progress).

const SIZE = {
  sm: 'size-[var(--icon-size-sm)]',
  md: 'size-[var(--icon-size-md)]',
  lg: 'size-[var(--icon-size-xl)]',
} as const

export type SpinnerProps = {
  size?: keyof typeof SIZE
  /** Arc on an inverse surface (inside a Primary or Danger button). */
  tone?: 'default' | 'inverse'
  /** Screen reader text, e.g. "Loading". Leave out when the spinner sits inside a labelled control. */
  label?: string
  className?: string
}

export function Spinner({ size = 'md', tone = 'default', label, className }: SpinnerProps) {
  const ring = (
    <span
      aria-hidden
      className={cn(
        'block shrink-0 animate-spin rounded-full border-[length:var(--border-width-2)] border-ui-state-selected',
        '[animation-duration:var(--duration-long4)] [animation-timing-function:var(--easing-linear)]',
        'motion-reduce:[animation-duration:2400ms]',
        tone === 'inverse' ? 'border-t-ui-fg-inverse' : 'border-t-ui-fg',
        SIZE[size],
        className,
      )}
    />
  )
  if (!label) return ring
  return (
    <span role="status" className="inline-flex">
      {ring}
      <span className="sr-only">{label}</span>
    </span>
  )
}
