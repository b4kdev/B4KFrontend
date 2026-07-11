'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import useSWR from 'swr'
import { Route, Bookmark, RefreshCw } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import type { HomePopularPlan } from '@/app/api/home/popular-plans/route'

function PlanCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden animate-pulse"
      style={{ width: 'clamp(220px, 64vw, 280px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
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

function PlanCard({ plan, t }: { plan: HomePopularPlan; t: ReturnType<typeof useTranslations> }) {
  const title = getDisplayName({ name_en: plan.title })
  return (
    <Link
      href={`/itinerary/${plan.id}`}
      className="flex flex-col overflow-hidden hover:opacity-90 transition-opacity"
      style={{ width: 'clamp(220px, 64vw, 280px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('card.ariaLabel', { title, author: plan.author_name })}
    >
      <div className="relative bg-bg-3 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
        <Route size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        {plan.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
        )}
        {plan.is_partner && (
          <span
            className="absolute top-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.08em] uppercase text-bg bg-lav px-[6px] py-[3px]"
            aria-label={t('sponsored')}
          >
            {t('sponsored')}
          </span>
        )}
      </div>
      <div className="p-sp-3 flex flex-col gap-[3px]">
        <p className="text-f-md font-semibold text-fg line-clamp-1">{title}</p>
        <div className="flex items-center justify-between">
          <p className="text-f-xs text-muted">{plan.author_name}</p>
          <p className="flex items-center gap-[3px] text-f-xs text-muted tabular-nums shrink-0">
            <Bookmark size={10} strokeWidth={2} aria-hidden="true" />
            {plan.save_count}
          </p>
        </div>
        <p className="text-f-xs text-muted">{t('card.stops', { n: plan.stop_count })}</p>
      </div>
    </Link>
  )
}

export default function PopularPlans() {
  const t = useTranslations('home.popularPlans')
  const { data, isLoading, error, mutate } = useSWR<HomePopularPlan[]>('/api/home/popular-plans', fetcher)

  if (!isLoading && !error && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} viewAllLabel={t('viewAll')} viewAllHref="/explore" />
      {isLoading && (
        <HScrollRow>
          {[0,1,2,3].map(i => <PlanCardSkeleton key={i} />)}
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
          {data.map(plan => <PlanCard key={plan.id} plan={plan} t={t} />)}
        </HScrollRow>
      )}
    </section>
  )
}
