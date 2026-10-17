// Class strings shared by library components. Written out in full so Tailwind finds them.

/** Grows the tap area to 44 (target/touch-min) without changing the drawn size. Needs `relative`. */
export const HIT_AREA =
  "before:absolute before:left-1/2 before:top-1/2 before:h-[max(100%,var(--target-touch-min))] before:w-[max(100%,var(--target-touch-min))] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"

/** Keyboard focus ring (focus/ring, UI-15): outside the element. */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:shadow-focus-ring'

/** Keyboard focus ring drawn inside the element (rows, tabs, menu items). */
export const FOCUS_RING_INSET =
  'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-border-focus)]'

/** Hover and pressed state layer (UI-32) for unfilled controls. */
export const STATE_LAYER = 'enabled:hover:bg-ui-state-hover enabled:active:bg-ui-state-pressed'

/** Field frame shared by Text input, Select, Textarea and Search input (UI-51, UI-58). */
export const FIELD_FRAME =
  'border border-ui-border-strong bg-transparent text-ui-fg type-body-base transition-colors duration-short4 ease-standard hover:border-ui-fg-muted focus-within:border-[length:var(--border-width-2)] focus-within:border-ui-border-focus'
