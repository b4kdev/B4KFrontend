'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

// Slider (UI-62, build-ahead; Figma Atoms › Slider): Single or Range. Track = progress pill
// (progress/height, state-selected), fill color/fg, thumbs control/box-size circles with a 2px
// color/bg outline; label and current value above. Native range inputs: arrow keys step, Page
// keys jump; aria-valuetext states the value with units. 44 tap area.

type Common = {
  /** Figma Label. */
  label: string
  /** Figma Value: the formatted value shown above, e.g. "Up to 5 km". */
  valueText: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export type SliderProps =
  | (Common & { type?: 'single'; value: number; onValueChange: (v: number) => void })
  | (Common & { type: 'range'; value: [number, number]; onValueChange: (v: [number, number]) => void; thumbLabels: [string, string] })

const THUMB =
  'pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent outline-none disabled:cursor-not-allowed ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[var(--control-box-size)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[length:var(--border-width-2)] [&::-webkit-slider-thumb]:border-ui-bg [&::-webkit-slider-thumb]:bg-ui-fg ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[var(--control-box-size)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[length:var(--border-width-2)] [&::-moz-range-thumb]:border-ui-bg [&::-moz-range-thumb]:bg-ui-fg ' +
  // Pseudo-classes go before the thumb pseudo-element so the selectors stay valid.
  '[&:focus-visible::-webkit-slider-thumb]:shadow-focus-ring [&:focus-visible::-moz-range-thumb]:shadow-focus-ring ' +
  // Hover state layer: state-hover 8px (space-2) around the 20 thumb = the 36 Figma circle.
  '[&:enabled:hover:not(:focus-visible)::-webkit-slider-thumb]:shadow-[0_0_0_var(--space-2)_var(--color-state-hover)] [&:enabled:hover:not(:focus-visible)::-moz-range-thumb]:shadow-[0_0_0_var(--space-2)_var(--color-state-hover)] ' +
  '[&:enabled:hover:focus-visible::-webkit-slider-thumb]:shadow-[shadow:var(--focus-ring),0_0_0_var(--space-2)_var(--color-state-hover)] [&:enabled:hover:focus-visible::-moz-range-thumb]:shadow-[shadow:var(--focus-ring),0_0_0_var(--space-2)_var(--color-state-hover)] ' +
  '[&:disabled::-webkit-slider-thumb]:cursor-not-allowed [&:disabled::-webkit-slider-thumb]:bg-ui-fg-disabled [&:disabled::-moz-range-thumb]:cursor-not-allowed [&:disabled::-moz-range-thumb]:bg-ui-fg-disabled'

export function Slider(props: SliderProps) {
  const { label, valueText, min = 0, max = 100, step = 1, disabled, className } = props
  const id = useId()
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const [lo, hi] = props.type === 'range' ? props.value : [min, props.value]
  return (
    <div className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      <div className="flex items-start justify-between">
        <span id={`${id}-label`} className={cn('type-body-label', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')}>{label}</span>
        <span aria-hidden className={cn('type-body-caption', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg')}>{valueText}</span>
      </div>
      <div className="relative h-[var(--control-box-size)]">
        <div className="absolute inset-x-0 top-1/2 h-[var(--progress-height)] -translate-y-1/2 rounded-full bg-ui-state-selected" />
        <div
          className={cn('absolute top-1/2 h-[var(--progress-height)] -translate-y-1/2 rounded-full', disabled ? 'bg-ui-fg-disabled' : 'bg-ui-fg')}
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
        />
        {props.type === 'range' ? (
          <>
            <input
              type="range" min={min} max={max} step={step} value={lo} disabled={disabled}
              aria-label={props.thumbLabels[0]} aria-valuetext={valueText}
              onChange={(e) => props.onValueChange([Math.min(Number(e.target.value), hi), hi])}
              className={THUMB}
            />
            <input
              type="range" min={min} max={max} step={step} value={hi} disabled={disabled}
              aria-label={props.thumbLabels[1]} aria-valuetext={valueText}
              onChange={(e) => props.onValueChange([lo, Math.max(Number(e.target.value), lo)])}
              className={THUMB}
            />
          </>
        ) : (
          <input
            type="range" min={min} max={max} step={step} value={props.value} disabled={disabled}
            aria-labelledby={`${id}-label`} aria-valuetext={valueText}
            onChange={(e) => props.onValueChange(Number(e.target.value))}
            className={THUMB}
          />
        )}
      </div>
    </div>
  )
}
