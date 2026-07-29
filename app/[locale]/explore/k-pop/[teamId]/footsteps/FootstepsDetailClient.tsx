'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { MapPin, ImageOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import type { FootstepsDetail, FootstepsPoi } from '@/lib/kpop-footsteps'

type TypeFilter = 'all' | 'museum' | 'park' | 'cafe'

function FootstepsCard({ poi, locale }: { poi: FootstepsPoi; locale: string }) {
  const t = useTranslations('explore')
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
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
        <span className="text-f-xs text-muted leading-relaxed">{relationship}</span>
        <span className="text-f-xxs text-muted">{poi.display_region}</span>
      </div>
    </>
  )

  const className = "block mb-sp-3 [break-inside:avoid] overflow-hidden"
  const style = { background: 'var(--bg-2)', border: '1px solid var(--bdr)' }

  // verified:false items don't have a real DB id — linking to /place/{poi_id} would
  // 404. Same "disable, don't silently break" instinct as ExplorePoiCard's hasRealId.
  if (poi.verified === false) {
    return <article className={className} style={style}>{body}</article>
  }
  return (
    <Link href={`/place/${poi.poi_id}`} className={`${className} transition-opacity hover:opacity-80`} style={style}>
      {body}
    </Link>
  )
}

export default function FootstepsDetailClient({ teamId }: { teamId: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const { data, isLoading, error, mutate } = useSWR<FootstepsDetail>(
    [`/api/explore/k-pop/footsteps/${teamId}`, locale],
    ([url]) => fetcher<FootstepsDetail>(url),
    { revalidateOnFocus: false },
  )
  const isError = !!error

  return (
    <div className="px-sp-4 lg:px-sp-6 pt-sp-5 pb-sp-20 max-w-[900px] mx-auto">
      {isLoading && !data && (
        <div aria-busy="true" aria-label={t('loading')} className="h-[400px] animate-pulse" style={{ background: 'var(--bg-2)' }} />
      )}

      {isError && !data && (
        <div
          className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t('error.retry')}
          </button>
        </div>
      )}

      {!isError && data && (
        <>
          <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-4">
            <Link href="/explore/k-pop" className="text-muted-2 hover:text-fg transition-colors">{t('kpop.title')}</Link>
            <span>›</span>
            <span className="text-muted-2">{data.agencyName}</span>
            <span>›</span>
            <span className="text-muted-2">{data.teamNameEn}</span>
            <span>›</span>
            <span className="text-fg">{t('footsteps.breadcrumb')}</span>
          </div>

          <h1 className="font-display text-fg text-f-display-tile mb-sp-2">
            {data.memberName} {t('footsteps.title')}
          </h1>
          <p className="text-f-md text-muted mb-sp-5">
            {t('footsteps.subtitle', { count: data.totalCount })}
          </p>

          <div className="flex gap-sp-2 overflow-x-auto pb-sp-2 mb-sp-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group">
            {(['all', 'museum', 'park', 'cafe'] as const).map(key => {
              const count = key === 'all' ? data.totalCount : data.typeCounts[key]
              const label = key === 'all' ? t('footsteps.filterAll')
                : key === 'museum' ? t('footsteps.filterMuseum')
                : key === 'park' ? t('footsteps.filterPark')
                : t('footsteps.filterCafe')
              const selected = typeFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  aria-pressed={selected}
                  className="shrink-0 flex items-center min-h-touch px-sp-4 rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors duration-[80ms]"
                  style={selected
                    ? { background: 'var(--lav)', color: 'var(--bg)' }
                    : { background: 'var(--bg-3)', color: 'var(--muted)', border: '1px solid var(--lav-border)' }}
                >
                  {label} {count}
                </button>
              )
            })}
          </div>

          {(() => {
            const items = typeFilter === 'all' ? data.items : data.items.filter(p => p.poi_type === typeFilter)
            if (items.length === 0) {
              return (
                <div
                  className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                >
                  <ImageOff size={36} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-3" />
                  <p className="text-f-md text-muted">{t('sectionEmpty')}</p>
                </div>
              )
            }
            return (
              <div className="[columns:2] lg:[columns:3] [column-gap:var(--sp-3)]">
                {items.map(poi => <FootstepsCard key={poi.poi_id} poi={poi} locale={locale} />)}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
