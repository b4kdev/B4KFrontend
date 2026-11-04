'use client'

import NextImage from 'next/image'
import { createContext, useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { cn } from '@/lib/cn'
import { Skeleton } from './Progress'
import { PLACE_TYPE_COLOR, PlaceTypeIcon, type PlaceType } from './Content'

// Image (Figma Atoms › Image): a photo of a place, locked to one of four ratios: 1:1 (thumbnails),
// 4:3 (cards), 16:9 (media), 12:5 (wide heroes); the parent rounds it. Loading = skeleton pulse;
// Missing = control fill with a squircle tile in the place type's colour and its icon in black (Place
// when the type is unknown).
// object-cover, lazy. A photo that fails is tried once more after a second, keeps its box, and
// leaves its URL for the data team.

const RATIO = { '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '16:9': 'aspect-video', '12:5': 'aspect-[12/5]' } as const

/** The type label under the icon of a missing photo (Show label), given once by the app shell:
 * the Place label until places carry their type. */
export const ImageMissingLabel = createContext('')

export type ImageProps = {
  /** Figma Ratio. */
  ratio?: keyof typeof RATIO
  src?: string | null
  /** Describes the place; empty string when decorative. */
  alt: string
  /** next/image sizes hint, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes?: string
  priority?: boolean
  /** Figma Show label: the type label under the icon when the photo is missing (cards, large tiles). */
  missingLabel?: string
  /** Figma Place type icon › Type when the photo is missing; Place by default. */
  placeType?: PlaceType
  className?: string
}

export function Image({ ratio = '1:1', src, alt, sizes = '100vw', priority, missingLabel, placeType = 'place', className }: ImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'missing'>(src ? 'loading' : 'missing')
  const [attempt, setAttempt] = useState(0)
  // A new photo starts over (not on mount: a cached photo can load before this runs).
  const shownSrc = useRef(src)
  useEffect(() => {
    if (shownSrc.current === src) return
    shownSrc.current = src
    setState(src ? 'loading' : 'missing')
    setAttempt(0)
  }, [src])
  const failed = () => {
    if (attempt === 0) {
      window.setTimeout(() => setAttempt(1), 1000)
      return
    }
    setState('missing')
    Sentry.addBreadcrumb({ category: 'image', level: 'warning', message: 'photo failed to load', data: { src } })
  }
  return (
    <span className={cn('relative block w-full overflow-hidden', state !== 'loading' && 'bg-control-fill', RATIO[ratio], className)}>
      {src && state !== 'missing' ? (
        <NextImage
          key={attempt}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onLoad={() => setState('loaded')}
          onError={failed}
        />
      ) : null}
      {state === 'loading' ? <Skeleton className="absolute inset-0" /> : null}
      {state === 'missing' ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-2)] text-ui-fg-muted">
          <span
            aria-hidden
            style={{ backgroundColor: PLACE_TYPE_COLOR[placeType] }}
            className="flex aspect-square w-[min(40%,var(--empty-tile-size))] items-center justify-center rounded-sq-md text-field-fg"
          >
            <PlaceTypeIcon type={placeType} className="size-1/2 [stroke-width:2.6]" />
          </span>
          {/* The label takes the full text color: muted text on this fill is under 4.5:1 in both modes (the icon keeps muted, 3:1 is enough). */}
          {missingLabel ? <span aria-hidden className="type-eyebrow-category uppercase text-ui-fg">{missingLabel}</span> : null}
        </span>
      ) : null}
    </span>
  )
}
