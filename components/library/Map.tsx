import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Clapperboard, Landmark, MapPin as MapPinIcon, Music, Sparkles, Utensils } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FOCUS_RING, HIT_AREA } from './styles'

// Map atoms (UI-74, UI-39; Figma Atoms): Map pin, Cluster bubble, Map control.
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
  /** Figma State=Selected: map/pin-selected and 1.25x (UI-39). */
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
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-[length:var(--border-width-2)] border-map-ui-pin-stroke text-ui-fg-on-media',
        'transition-[width,height,background-color] duration-short4 ease-standard',
        selected ? 'size-[var(--map-pin-size-selected)] bg-map-ui-pin-selected' : 'size-[var(--map-pin-size)] bg-map-ui-pin-fill',
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
        'relative inline-flex shrink-0 items-center justify-center rounded-full border-[length:var(--border-width-2)] border-map-ui-pin-stroke bg-map-ui-pin-fill type-body-label text-ui-fg-on-media',
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
        'inline-flex size-[var(--target-touch-min)] shrink-0 items-center justify-center rounded-none border border-ui-border bg-ui-bg-raised text-ui-fg',
        'enabled:hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))] enabled:active:bg-[image:linear-gradient(var(--color-state-pressed),var(--color-state-pressed))]',
        'disabled:cursor-not-allowed disabled:text-ui-fg-disabled [&>svg]:size-[var(--icon-size-sm)]',
        CONTROL_FOCUS_RING,
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
})
