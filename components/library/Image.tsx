'use client'

import NextImage from 'next/image'
import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Progress'

// Image (Figma Atoms › Image): a photo of a place, square corners, locked to one of four
// ratios: 1:1 (thumbnails), 4:3 (cards), 16:9 (media), 12:5 (wide heroes). Loading = skeleton
// pulse; Missing = state-selected with the image icon. object-cover, lazy.

const RATIO = { '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '16:9': 'aspect-video', '12:5': 'aspect-[12/5]' } as const

export type ImageProps = {
  /** Figma Ratio. */
  ratio?: keyof typeof RATIO
  src?: string | null
  /** Describes the place; empty string when decorative. */
  alt: string
  /** next/image sizes hint, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes?: string
  priority?: boolean
  className?: string
}

export function Image({ ratio = '1:1', src, alt, sizes = '100vw', priority, className }: ImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'missing'>(src ? 'loading' : 'missing')
  return (
    <span className={cn('relative block w-full overflow-hidden rounded-none', state !== 'loading' && 'bg-ui-state-selected', RATIO[ratio], className)}>
      {src && state !== 'missing' ? (
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onLoad={() => setState('loaded')}
          onError={() => setState('missing')}
        />
      ) : null}
      {state === 'loading' ? <Skeleton className="absolute inset-0" /> : null}
      {state === 'missing' ? (
        <span className="absolute inset-0 flex items-center justify-center text-ui-fg-muted">
          <ImageIcon aria-hidden className="size-[var(--icon-size-xl)]" />
        </span>
      ) : null}
    </span>
  )
}
