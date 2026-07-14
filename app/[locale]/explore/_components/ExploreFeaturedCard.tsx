'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { TrendingUp, MapPin, ExternalLink } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'

// SC-36 (KD_04/KB_04, S-OIRFKM/S-ZVKQUS) — 1 featured wide card above the
// section's horizontal scroll row. Same fields as ExplorePoiCard, wide layout.
export default function ExploreFeaturedCard({ poi }: { poi: ExplorePoi }) {
  const t = useTranslations('explore')
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
  const isPartner = !!(poi.is_partner && poi.partner_url && /^https?:\/\//.test(poi.partner_url))

  return (
    <Link
      href={isPartner ? (poi.partner_url ?? `/map?poi=${poi.poi_id}`) : `/map?poi=${poi.poi_id}`}
      target={isPartner ? '_blank' : undefined}
      rel={isPartner ? 'noopener noreferrer' : undefined}
      className="flex flex-col sm:flex-row overflow-hidden mb-sp-4 transition-opacity hover:opacity-90"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('card.ariaLabel', { name })}
    >
      <div
        className="relative sm:w-[42%] shrink-0 flex items-center justify-center"
        style={{ background: 'var(--bg-3)', aspectRatio: '16/9' }}
      >
        {poi.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.primary_image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <MapPin size={28} strokeWidth={2} className="text-muted-2" />
        )}
        {isPartner && (
          <span
            className="absolute top-sp-2 left-sp-2 text-f-xxs font-semibold px-sp-2 py-[3px] rounded-full"
            style={{ background: 'var(--backdrop-50)', color: 'var(--fg)', border: '1px solid var(--bdr)' }}
          >
            {t('card.sponsored')}
          </span>
        )}
      </div>
      <div className="p-sp-4 flex flex-col gap-sp-2 justify-center flex-1">
        <span className="text-f-xxs font-bold tracking-[0.1em] uppercase text-lav">
          {t('card.featured')}
        </span>
        <div className="flex items-start justify-between gap-sp-2">
          <span className="text-f-xl font-semibold text-fg leading-tight">{name}</span>
          {isPartner && <ExternalLink size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />}
        </div>
        <div className="flex items-center gap-sp-3">
          <span className="text-f-sm text-muted">{poi.display_region}</span>
          {poi.is_trending && (
            <span
              className="flex items-center gap-[3px] text-f-xxs font-semibold text-lav px-[6px] py-[2px] rounded-full"
              style={{ background: 'var(--lav-dim)' }}
            >
              <TrendingUp size={9} strokeWidth={2} aria-hidden="true" />
              {t('card.trending')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
