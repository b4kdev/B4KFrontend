// Class strings shared by library components. Written out in full so Tailwind finds them.

/** Grows the tap area to 44 (target/touch-min) without changing the drawn size. Needs `relative`. */
export const HIT_AREA =
  "before:absolute before:left-1/2 before:top-1/2 before:h-[max(100%,var(--target-touch-min))] before:w-[max(100%,var(--target-touch-min))] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"

/** Keyboard focus ring (focus/ring): outside the element. */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:shadow-focus-ring'

/** Keyboard focus ring drawn inside the element (rows, tabs, menu items). */
export const FOCUS_RING_INSET =
  'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-border-focus)]'

/** Hover and pressed state layer for unfilled controls. */
export const STATE_LAYER = 'enabled:hover:bg-ui-state-hover enabled:active:bg-ui-state-pressed'

/** Field frame shared by Text input, Select, Textarea and Search input. */
export const FIELD_FRAME =
  'rounded-field bg-control-fill shadow-rest text-ui-fg type-body-base transition-[box-shadow,background-color] duration-short4 ease-out-strong focus-within:shadow-[0_0_0_var(--focus-ring-width)_var(--color-border-focus),var(--shadow-float)]'

/** Press feedback: every pressable shrinks a little on pointer-down (none under reduced motion). */
export const PRESS =
  'transition-[background-color,box-shadow,color,transform] duration-short3 ease-out-strong enabled:active:scale-[var(--press-scale)] motion-reduce:enabled:active:scale-100'

/** Resting surface that lifts on hover under a fine pointer (shadow only, no movement). */
export const LIFT = 'shadow-rest [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-lift'
