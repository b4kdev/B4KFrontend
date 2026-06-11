'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, RefreshCw } from 'lucide-react'
import { useHome } from '@/hooks/useHome'
import { getDisplayName } from '@/lib/display-name'
import SectionHead from './SectionHead'
import type { HomeSeasonalPoi } from '@/app/api/home/route'

const POI_GRADS: Record<string, string> = {
  Heritage: 'linear-gradient(160deg,#0c1a3a,#6b4708)',
  Nature:   'linear-gradient(160deg,#0a1f0a,#366e18)',
  Landmark: 'linear-gradient(180deg,#020210,#091832)',
  Culture:  'linear-gradient(145deg,#1a1226,#4a3060)',
  Beach:    'linear-gradient(155deg,#0a1832,#243a64)',
  Default:  'linear-gradient(150deg,#1a1a1a,#2a2a2a)',
}

function PoiCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="bg-muted-3" style={{ aspectRatio: '3/2' }} />
      <div className="p-sp-3 space-y-sp-2">
        <div className="h-[13px] w-2/3 rounded bg-muted-3" />
        <div className="h-[11px] w-1/2 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function PoiCard({ poi, t }: { poi: HomeSeasonalPoi; t: ReturnType<typeof useTranslations> }) {
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
  const grad = POI_GRADS[poi.category] ?? POI_GRADS.Default

  return (
    <Link
      href="/map"
      className="rounded-xl overflow-hidden flex flex-col hover:opacity-90 transition-opacity"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('card.ariaLabel', { name, region: poi.display_region })}
    >
      <div className="relative" style={{ aspectRatio: '3/2', background: grad }}>
        <span
          className="absolute top-[10px] right-[10px] text-[9px] font-bold tracking-[0.1em] uppercase text-fg"
          style={{ background: 'var(--backdrop-50)', padding: '3px 8px', borderRadius: 2 }}
          aria-hidden
        >
          {poi.category}
        </span>
        {poi.primary_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.primary_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        )}
      </div>
      <div className="p-sp-3 flex flex-col gap-[3px]">
        <p className="text-f-md font-semibold text-fg leading-snug">{name}</p>
        <p className="flex items-center gap-[4px] text-f-xs text-muted">
          <MapPin size={10} strokeWidth={2} aria-hidden />
          {poi.display_region}
        </p>
      </div>
    </Link>
  )
}

export default function SeasonalPois() {
  const t = useTranslations('home.seasonalPois')
  const tCommon = useTranslations('common')
  const { seasonalPois, isLoading, isError, mutate } = useHome()

  return (
    <section className="mb-11" aria-label={t('title')}>
      <SectionHead title={t('title')} subtitle={t('subtitle')} seeAllLabel={t('seeAll')} />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-4" aria-label={tCommon('loading')} aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map(i => <PoiCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div
          className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          role="alert"
        >
          <RefreshCw size={28} strokeWidth={2} className="text-muted-2 mb-3" />
          <p className="text-f-base font-semibold text-fg mb-1">{tCommon('error')}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 inline-flex items-center min-h-touch px-4 rounded-full text-f-sm font-semibold text-lav"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
          >
            {tCommon('retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && seasonalPois.length === 0 && (
        <div
          className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
        >
          <MapPin size={32} strokeWidth={2} className="text-muted-2 mb-3" />
          <p className="text-f-base font-semibold text-fg mb-1">{t('empty.title')}</p>
          <p className="text-f-sm text-muted mb-4 max-w-[280px]">{t('empty.desc')}</p>
          <Link
            href="/map"
            className="inline-flex items-center min-h-touch px-4 rounded-full text-f-sm font-semibold text-lav"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
          >
            {t('empty.cta')}
          </Link>
        </div>
      )}

      {!isLoading && !isError && seasonalPois.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-4">
          {seasonalPois.map(poi => (
            <PoiCard key={poi.place_id} poi={poi} t={t} />
          ))}
        </div>
      )}
    </section>
  )
}
