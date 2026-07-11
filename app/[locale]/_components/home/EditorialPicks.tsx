'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import HomePoiCard, { HomePoiCardSkeleton } from './HomePoiCard'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

const CATEGORIES = [
  { key: '',          labelKey: 'catAll'     },
  { key: 'k-pop',    labelKey: 'catKPop'    },
  { key: 'k-drama',  labelKey: 'catKDrama'  },
  { key: 'k-beauty', labelKey: 'catKBeauty' },
  { key: 'k-culture',labelKey: 'catKCulture'},
]

export default function EditorialPicks() {
  const t = useTranslations('home.editorial')
  const [cat, setCat] = useState('')
  const url = cat ? `/api/home/editorial?category=${cat}` : '/api/home/editorial'
  const { data, isLoading, error, mutate } = useSWR<HomeTrendingPoi[]>(url, fetcher)

  if (!isLoading && !error && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} viewAllLabel={t('viewAll')} viewAllHref="/explore" />

      {/* Category filter chips */}
      <div className="flex gap-sp-2 mb-sp-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="shrink-0 px-sp-3 py-[5px] text-f-xs font-semibold rounded-full transition-colors"
            style={{
              background: cat === c.key ? 'var(--lav)' : 'var(--bg-3)',
              color: cat === c.key ? 'var(--bg)' : 'var(--muted)',
              border: cat === c.key ? '1px solid var(--lav)' : '1px solid var(--bdr)',
            }}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {isLoading && (
        <HScrollRow>
          {[0,1,2,3].map(i => <HomePoiCardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {error && (
        <div className="flex items-center gap-sp-3 py-sp-6 text-muted text-f-sm" role="alert">
          <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
          <span>{t('error')}</span>
          <button onClick={() => mutate()} className="text-lav font-semibold hover:opacity-80 transition-opacity">
            {t('retry')}
          </button>
        </div>
      )}
      {!isLoading && !error && data && (
        <HScrollRow>
          {data.map(poi => <HomePoiCard key={poi.place_id} poi={poi} />)}
        </HScrollRow>
      )}
    </section>
  )
}
