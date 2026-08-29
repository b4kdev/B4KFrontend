'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import HomePoiCard, { HomePoiCardSkeleton } from './HomePoiCard'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

interface Props {
  /** i18n namespace, e.g. 'home.trending' — must expose `title` + `viewAll` (+ `error`/`retry` when showError) */
  namespace: string
  /** SWR key. Pass `null` to skip fetching (e.g. auth-gated sections). */
  endpoint: string | null
  /** Optional badge shown on every card, e.g. t('newBadge') */
  badge?: string
  /** Optional content rendered between SectionHead and the card row (e.g. filter chips) */
  header?: ReactNode
  /** viewAll link target — defaults to '/explore' */
  viewAllHref?: string
  /** Whether to render the error/retry row on fetch failure. Default true. */
  showError?: boolean
}

export default function PoiCardRowSection({
  namespace,
  endpoint,
  badge,
  header,
  viewAllHref = '/explore',
  showError = true,
}: Props) {
  const t = useTranslations(namespace)
  const { data, isLoading, error, mutate } = useSWR<HomeTrendingPoi[]>(endpoint, fetcher)

  const hasError = showError && error

  if (!isLoading && !hasError && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} viewAllLabel={t('viewAll')} viewAllHref={viewAllHref} />
      {header}
      {isLoading && (
        <HScrollRow>
          {[0,1,2,3].map(i => <HomePoiCardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {hasError && (
        <div className="flex items-center gap-sp-3 py-sp-6 text-muted text-f-sm" role="alert">
          <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
          <span>{t('error')}</span>
          <button onClick={() => mutate()} className="text-fg font-semibold hover:opacity-80 transition-opacity duration-[80ms]">
            {t('retry')}
          </button>
        </div>
      )}
      {!isLoading && !hasError && data && (
        <HScrollRow>
          {data.map(poi => <HomePoiCard key={poi.poi_id} poi={poi} badge={badge} />)}
        </HScrollRow>
      )}
    </section>
  )
}
