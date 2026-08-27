'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getRelationLabel } from '@/lib/content-relation-labels'
import type { PerfumeFlagshipPoi } from '@/lib/kbeauty-perfume-flagships'
import MasonryGrid from '../../_components/MasonryGrid'
import TypeFilterChips from '../../_components/TypeFilterChips'

interface ApiResponse {
  totalCount: number
  items: PerfumeFlagshipPoi[]
}

export default function PerfumeFlagshipsDetailClient() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading, error, mutate } = useSWR<ApiResponse>(
    ['/api/explore/k-beauty/perfume-flagships', locale],
    ([url]) => fetcher<ApiResponse>(url),
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
            <Link href="/explore/k-beauty" className="text-muted-2 hover:text-fg transition-colors">{t('kbeauty.title')}</Link>
            <span>›</span>
            <span className="text-fg">{t('perfumeFlagships.breadcrumb')}</span>
          </div>

          <h1 className="font-display text-fg text-f-display-tile mb-sp-2">
            {t('perfumeFlagships.title')}
          </h1>
          <p className="text-f-md text-muted mb-sp-5">
            {t('perfumeFlagships.subtitle', { count: data.totalCount })}
          </p>

          <TypeFilterChips
            active={typeFilter}
            onChange={setTypeFilter}
            options={[
              { key: 'all', label: t('perfumeFlagships.filterAll'), count: data.totalCount },
              ...Array.from(new Set(data.items.map(p => p.poi_type))).map(key => ({
                key, label: getRelationLabel(key, locale),
              })),
            ]}
          />

          <MasonryGrid items={typeFilter === 'all' ? data.items : data.items.filter(p => p.poi_type === typeFilter)} />
        </>
      )}
    </div>
  )
}
