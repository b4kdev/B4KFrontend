'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import type { HeritageDetail } from '@/lib/kculture-heritage'
import MasonryGrid from '../../../_components/MasonryGrid'
import TypeFilterChips from '../../../_components/TypeFilterChips'

type TypeFilter = 'all' | 'gyeongju' | 'andong' | 'yeongju' | 'other'

export default function HeritageDetailClient({ region }: { region: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const { data, isLoading, error, mutate } = useSWR<HeritageDetail>(
    [`/api/explore/k-culture/heritage/${region}`, locale],
    ([url]) => fetcher<HeritageDetail>(url),
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
            className="flex items-center gap-sp-2 text-f-md font-semibold text-fg hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t('error.retry')}
          </button>
        </div>
      )}

      {!isError && data && (
        <>
          <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-4">
            <Link href="/explore/k-culture" className="text-muted-2 hover:text-fg transition-colors">{t('kculture.title')}</Link>
            <span>›</span>
            <span className="text-muted-2">{data.regionNameEn}</span>
            <span>›</span>
            <span className="text-fg">{t('heritage.breadcrumb')}</span>
          </div>

          <h1 className="font-display text-fg text-f-display-tile mb-sp-2">
            {data.regionNameEn} {t('heritage.title')}
          </h1>
          <p className="text-f-md text-muted mb-sp-5">
            {t('heritage.subtitle', { count: data.totalCount })}
          </p>

          <TypeFilterChips
            active={typeFilter}
            onChange={(k) => setTypeFilter(k as TypeFilter)}
            options={[
              { key: 'all', label: t('heritage.filterAll'), count: data.totalCount },
              { key: 'gyeongju', label: t('heritage.filterGyeongju') },
              { key: 'andong', label: t('heritage.filterAndong') },
              { key: 'yeongju', label: t('heritage.filterYeongju') },
            ]}
          />

          <MasonryGrid items={typeFilter === 'all' ? data.items : data.items.filter(p => p.poi_type === typeFilter)} />
        </>
      )}
    </div>
  )
}
