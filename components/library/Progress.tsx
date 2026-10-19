import { cn } from '@/lib/cn'

// Progress bar and Skeleton (UI-56; Figma Atoms).

export type ProgressBarProps = {
  /** 0 to 100. Left out = Figma Type=Indeterminate. */
  value?: number
  /** Accessible name, e.g. "Step 2 of 3" or "Uploading photo". */
  label: string
  className?: string
}

/** Pill progress/height 6, fill color/fg on a color/state-selected track. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const determinate = value !== undefined
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round(value) : undefined}
      className={cn('relative h-[var(--progress-height)] w-full overflow-hidden rounded-full bg-ui-state-selected', className)}
    >
      {determinate ? (
        <div
          className="h-full rounded-full bg-ui-fg transition-[width] duration-medium2 ease-standard"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      ) : (
        <div className="absolute inset-y-0 w-[35%] rounded-full bg-ui-fg motion-safe:animate-b4k-indeterminate motion-reduce:left-0" />
      )}
    </div>
  )
}

export type SkeletonProps = {
  /** Figma Shape. Size it with className (w-*, h-*, aspect-*). */
  shape?: 'rectangle' | 'line' | 'circle'
  className?: string
}

/** Placeholder shape in color/state-selected while content loads. Put aria-busy on the region. */
export function Skeleton({ shape = 'rectangle', className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'block bg-ui-state-selected motion-safe:animate-b4k-pulse',
        shape === 'circle' ? 'rounded-full' : 'rounded-none',
        shape === 'line' && 'h-[1em]',
        className,
      )}
    />
  )
}
