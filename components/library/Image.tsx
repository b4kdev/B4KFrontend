'use client'

import NextImage from 'next/image'
import { createContext, useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { cn } from '@/lib/cn'
import { Skeleton } from './Progress'
import { PlaceTypeIcon, type PlaceType } from './Content'

// Image (Figma Atoms › Image): a photo of a place, square corners, locked to one of four
// ratios: 1:1 (thumbnails), 4:3 (cards), 16:9 (media), 12:5 (wide heroes). Loading = skeleton
// pulse; Missing = state-selected with the place type icon (Place when the type is unknown).
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
    <span className={cn('relative block w-full overflow-hidden rounded-none', state !== 'loading' && 'bg-ui-state-selected', RATIO[ratio], className)}>
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
          <PlaceTypeIcon type={placeType} className="size-[var(--icon-size-xl)]" />
          {missingLabel ? <span aria-hidden className="type-eyebrow-category uppercase">{missingLabel}</span> : null}
        </span>
      ) : null}
    </span>
  )
}
