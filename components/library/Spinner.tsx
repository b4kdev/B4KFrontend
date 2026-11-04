import { cn } from '@/lib/cn'

// Spinner (Figma B4K UI Components › Atoms › Spinner): a color/fg round-cap quarter arc turning
// on a color/state-selected track, border-width/2. One turn per duration/long4, linear; slower under
// reduced motion (it still shows progress).

const SIZE = {
  sm: 'size-[var(--icon-size-sm)]',
  md: 'size-[var(--icon-size-md)]',
  lg: 'size-[var(--icon-size-xl)]',
} as const

/** Drawing box per size (icon-size-sm/md/xl), so the 2px stroke stays 2px. */
const BOX = { sm: 16, md: 20, lg: 32 } as const

export type SpinnerProps = {
  size?: keyof typeof SIZE
  /** Arc on an inverse surface (inside a Primary or Danger button). */
  tone?: 'default' | 'inverse'
  /** Screen reader text, e.g. "Loading". Leave out when the spinner sits inside a labelled control. */
  label?: string
  className?: string
}

export function Spinner({ size = 'sm', tone = 'default', label, className }: SpinnerProps) {
  const box = BOX[size]
  const r = box / 2 - 1
  const ring = (
    <svg
      aria-hidden
      viewBox={`0 0 ${box} ${box}`}
      fill="none"
      className={cn(
        'block shrink-0 animate-spin [stroke-width:var(--border-width-2)]',
        '[animation-duration:var(--duration-long4)] [animation-timing-function:var(--easing-linear)]',
        'motion-reduce:[animation-duration:2400ms]',
        SIZE[size],
        className,
      )}
    >
      {/* Track: state-selected; on an inverse surface fg-inverse at 25%. */}
      <circle cx={box / 2} cy={box / 2} r={r} className={tone === 'inverse' ? 'stroke-ui-fg-inverse opacity-25' : 'stroke-ui-state-selected'} />
      {/* Quarter arc with round caps, starting at 12 o'clock. */}
      <circle
        cx={box / 2}
        cy={box / 2}
        r={r}
        pathLength={100}
        strokeDasharray="25 100"
        strokeLinecap="round"
        transform={`rotate(-90 ${box / 2} ${box / 2})`}
        className={tone === 'inverse' ? 'stroke-ui-fg-inverse' : 'stroke-ui-fg'}
      />
    </svg>
  )
  if (!label) return ring
  return (
    <span role="status" className="inline-flex">
      {ring}
      <span className="sr-only">{label}</span>
    </span>
  )
}
