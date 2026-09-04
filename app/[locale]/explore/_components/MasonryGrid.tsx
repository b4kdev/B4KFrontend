'use client'

import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, ImageOff } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'

// DEC-61 — shared masonry card grid for the 4 new detail pages (K-Drama/K-Beauty/
// K-Food/K-Culture) plus K-Pop's existing footsteps page pattern (not retrofitted
// there — that page ships in a separate PR — but this is the same shape, extracted
// here so the other 4 don't each duplicate the card/masonry JSX).

export interface MasonryPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  /** Plain seed text (same convention as ExploreHeroSlide.subtitle) — content data, not UI chrome. */
  relationship_ko?: string
  relationship_en?: string
  verified?: boolean
}

export default function MasonryGrid({ items, emptyLabelKey = 'sectionEmpty' }: { items: MasonryPoi[]; emptyLabelKey?: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <ImageOff size={36} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-3" aria-hidden="true" />
        <p className="text-f-md text-muted">{t(emptyLabelKey)}</p>
      </div>
    )
  }

  return (
    <div className="[columns:2] lg:[columns:3] [column-gap:var(--sp-3)]">
      {items.map(poi => {
        const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko }, locale)
        const relationship = locale === 'ko' ? poi.relationship_ko : poi.relationship_en

        const body = (
          <>
            <div
              className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden"
              style={{ background: 'var(--bg-3)' }}
            >
              {poi.primary_image_url ? (
                <Image src={poi.primary_image_url} alt={name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-sp-1">
                  <MapPin size={20} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                  <span className="text-f-xxs text-muted">{t('card.imagePending')}</span>
                </div>
              )}
            </div>
            <div className="p-sp-3 flex flex-col gap-[4px]">
              <span className="text-f-md font-semibold text-fg leading-tight">{name}</span>
              {relationship && <span className="text-f-xs text-muted leading-relaxed">{relationship}</span>}
              <span className="text-f-xxs text-muted">{poi.display_region}</span>
            </div>
          </>
        )

        const className = 'block mb-sp-3 [break-inside:avoid] overflow-hidden'
        const style = { background: 'var(--bg-2)', border: '1px solid var(--bdr)' }

        // verified:false items don't have a real DB id — linking to /place/{poi_id}
        // would 404. Same "disable, don't silently break" instinct as ExplorePoiCard's
        // hasRealId.
        if (poi.verified === false) {
          return <article key={poi.poi_id} className={className} style={style}>{body}</article>
        }
        return (
          <Link key={poi.poi_id} href={`/place/${poi.poi_id}`} className={`${className} transition-opacity hover:opacity-80`} style={style}>
            {body}
          </Link>
        )
      })}
    </div>
  )
}
