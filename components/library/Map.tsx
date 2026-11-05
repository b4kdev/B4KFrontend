import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Clapperboard, Landmark, MapPin as MapPinIcon, Music, Sparkles, Utensils } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, HIT_AREA } from './styles'

// Map atoms (Figma Atoms): Map pin, Cluster bubble, Map control.
// These are the DOM versions (lists, legends, overlays). Markers inside the Naver map are drawn
// by the SDK with the same sizes and the hex values in tokens/colors.ts.

const CATEGORY_ICON = {
  generic: MapPinIcon,
  'k-pop': Music,
  'k-drama': Clapperboard,
  'k-beauty': Sparkles,
  'k-food': Utensils,
  'k-culture': Landmark,
} as const

export type MapPinProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Category. */
  category?: keyof typeof CATEGORY_ICON
  /** Figma State=selected: map/pin-selected and 1.25x. */
  selected?: boolean
  /** The place name, read by screen readers. */
  label: string
}

/** Map pin: round, map/pin-fill with a map/pin-stroke ring, K-domain icon in fg-on-media. 44 tap area. */
export const MapPin = forwardRef<HTMLButtonElement, MapPinProps>(function MapPin(
  { category = 'generic', selected = false, label, className, ...props },
  ref,
) {
  const Icon = CATEGORY_ICON[category]
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-pin border-[length:var(--border-width-pin)] text-[var(--map-glyph-pin-fg,var(--map-type-other))] shadow-pin',
        'transition-[width,height,background-color] duration-short4 ease-standard',
        'bg-[var(--map-glyph-pin-bg,var(--map-type-other))]',
        selected ? 'size-[var(--map-pin-size-selected)] border-map-ui-pin-selected' : 'size-[var(--map-pin-size)] border-map-ui-pin-stroke',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className={selected ? 'size-[var(--icon-size-md)]' : 'size-[var(--icon-size-xs)]'} />
    </button>
  )
})

export type ClusterBubbleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Count. Size follows it: sm under 10, md 10 to 49, lg 50+. */
  count: number
  /** e.g. "12 places, zoom in". */
  label: string
}

/** Cluster bubble: grouped places; tap zooms in two levels. */
export const ClusterBubble = forwardRef<HTMLButtonElement, ClusterBubbleProps>(function ClusterBubble(
  { count, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-cluster border-[length:var(--border-width-pin)] border-map-ui-cluster-stroke bg-map-ui-cluster-fill font-extrabold tabular-nums text-map-ui-cluster-fg shadow-pin',
        count < 10 ? 'size-[var(--map-cluster-size-sm)]' : count < 50 ? 'size-[var(--map-cluster-size-md)]' : 'size-[var(--map-cluster-size-lg)]',
        FOCUS_RING,
        HIT_AREA,
        className,
      )}
      {...props}
    >
      {count}
    </button>
  )
})

export type MapControlProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Figma Icon. */
  icon: ReactNode
  label: string
}

/** Focus ring 3 to 5px outside: the focus/ring gap plus the 1px border. */
const CONTROL_FOCUS_RING =
  'focus-visible:outline-none focus-visible:shadow-[0_0_0_calc(var(--focus-ring-offset)_+_var(--border-width-1))_var(--color-focus-halo),0_0_0_calc(var(--focus-ring-offset)_+_var(--focus-ring-width)_+_var(--border-width-1))_var(--color-border-focus)]'

/** Map control: square 44 map button (Zoom, later Locate me): bg-raised, 1px border, icon 16. */
export const MapControl = forwardRef<HTMLButtonElement, MapControlProps>(function MapControl(
  { icon, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-[var(--target-touch-min)] shrink-0 items-center justify-center rounded-control bg-ui-bg-elevated text-ui-fg shadow-float',
        'transition-[background-color,transform] duration-short3 ease-out-strong enabled:active:scale-[var(--press-scale)] motion-reduce:enabled:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:enabled:hover:bg-control-fill-hover',
        'disabled:cursor-not-allowed disabled:text-ui-fg-disabled [&>svg]:size-[var(--icon-size-md)]',
        CONTROL_FOCUS_RING,
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
})
