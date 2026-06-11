'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { TrendingUp, MapPin } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'

export default function ExplorePoiCard({ poi }: { poi: ExplorePoi }) {
  const t = useTranslations('explore')
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })

  return (
    <Link
      href={`/map?poi=${poi.place_id}`}
      className="flex flex-col rounded-lg overflow-hidden transition-opacity hover:opacity-80"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('card.ariaLabel', { name })}
    >
      <div
        className="w-full aspect-[4/3] flex items-center justify-center"
        style={{ background: 'var(--bg-3)' }}
      >
        {poi.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poi.primary_image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <MapPin size={22} strokeWidth={2} className="text-muted-2" />
        )}
      </div>
      <div className="p-sp-3 flex flex-col gap-[4px]">
        <div className="flex items-start justify-between gap-sp-2">
          <span className="text-f-md font-semibold text-fg leading-tight line-clamp-2 flex-1">
            {name}
          </span>
          {poi.is_trending && (
            <span
              className="shrink-0 flex items-center gap-[3px] text-f-xxs font-semibold text-lav px-[6px] py-[2px] rounded-full"
              style={{ background: 'var(--lav-dim)' }}
            >
              <TrendingUp size={9} strokeWidth={2} />
              {t('card.trending')}
            </span>
          )}
        </div>
        <span className="text-f-xs text-muted">{poi.display_region}</span>
      </div>
    </Link>
  )
}
