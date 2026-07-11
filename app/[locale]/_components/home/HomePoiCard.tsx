'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, Bookmark } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

interface Props {
  poi: HomeTrendingPoi
  badge?: string
}

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function HomePoiCard({ poi, badge }: Props) {
  const t = useTranslations('home.poiCard')
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })

  return (
    <Link
      href={`/map?poi=${poi.place_id}`}
      className="flex flex-col overflow-hidden hover:opacity-90 transition-opacity"
      style={{
        width: 'clamp(220px, 44vw, 280px)',
        background: 'var(--bg-2)',
        border: '1px solid var(--bdr)',
      }}
      aria-label={t('ariaLabel', { name, region: poi.display_region })}
    >
      <div className="relative bg-bg-3 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
        <MapPin size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        {poi.primary_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.primary_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
        )}
        {badge && (
          <span
            className="absolute top-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.1em] uppercase text-bg bg-lav px-[6px] py-[3px]"
            aria-label={badge}
          >
            {badge}
          </span>
        )}
        <span
          className="absolute top-sp-2 right-sp-2 text-f-xxs font-semibold text-fg"
          style={{ background: 'var(--backdrop-50)', padding: '2px 6px' }}
          aria-hidden="true"
        >
          {poi.display_domain}
        </span>
      </div>
      <div className="p-sp-3 flex flex-col gap-[3px]">
        <p className="text-f-md font-semibold text-fg leading-snug line-clamp-1">{name}</p>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-[3px] text-f-xs text-muted">
            <MapPin size={10} strokeWidth={2} aria-hidden="true" />
            <span className="line-clamp-1">{poi.display_region}</span>
          </p>
          <p className="flex items-center gap-[3px] text-f-xs text-muted tabular-nums shrink-0">
            <Bookmark size={10} strokeWidth={2} aria-hidden="true" />
            {formatCount(poi.save_count)}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function HomePoiCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden animate-pulse"
      style={{ width: 'clamp(220px, 44vw, 280px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-hidden="true"
    >
      <div className="bg-muted-3" style={{ aspectRatio: '4/3' }} />
      <div className="p-sp-3 space-y-sp-2">
        <div className="h-[13px] w-3/4 bg-muted-3" />
        <div className="h-[11px] w-1/2 bg-muted-3" />
      </div>
    </div>
  )
}
