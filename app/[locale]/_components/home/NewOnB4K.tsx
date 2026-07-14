'use client'

import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import HomePoiCard, { HomePoiCardSkeleton } from './HomePoiCard'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

export default function NewOnB4K() {
  const t = useTranslations('home.newOnB4K')
  const { data, isLoading, error, mutate } = useSWR<HomeTrendingPoi[]>('/api/home/new', fetcher)

  if (!isLoading && !error && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} viewAllLabel={t('viewAll')} viewAllHref="/explore" />
      {isLoading && (
        <HScrollRow>
          {[0,1,2,3].map(i => <HomePoiCardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {error && (
        <div className="flex items-center gap-sp-3 py-sp-6 text-muted text-f-sm" role="alert">
          <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
          <span>{t('error')}</span>
          <button onClick={() => mutate()} className="text-lav font-mono uppercase tracking-[0.06em] hover:opacity-80 transition-opacity duration-[80ms]">
            {t('retry')}
          </button>
        </div>
      )}
      {!isLoading && !error && data && (
        <HScrollRow>
          {data.map(poi => <HomePoiCard key={poi.poi_id} poi={poi} badge={t('newBadge')} />)}
        </HScrollRow>
      )}
    </section>
  )
}
