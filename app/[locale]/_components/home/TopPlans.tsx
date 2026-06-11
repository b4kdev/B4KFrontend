'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Route, Heart, Bookmark, RefreshCw } from 'lucide-react'
import { useHome } from '@/hooks/useHome'
import { getDisplayName } from '@/lib/display-name'
import SectionHead from './SectionHead'
import type { HomeTopPlan } from '@/app/api/home/route'

const CARD_GRADS = [
  'linear-gradient(150deg,#0c1a3a,#4a2a8a)',
  'linear-gradient(160deg,#0a1f0a,#366e18)',
  'linear-gradient(150deg,#2a1a0a,#8a6030)',
]

function PlanCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="bg-muted-3" style={{ aspectRatio: '3/2' }} />
      <div className="p-sp-4 space-y-sp-2">
        <div className="h-[13px] w-3/4 rounded bg-muted-3" />
        <div className="h-[11px] w-1/2 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function PlanCard({ plan, index, t }: { plan: HomeTopPlan; index: number; t: ReturnType<typeof useTranslations> }) {
  const name = getDisplayName({ name_en: plan.title })
  const grad = CARD_GRADS[index % CARD_GRADS.length]

  return (
    <Link
      href={`/itinerary/${plan.id}`}
      className="rounded-xl overflow-hidden flex flex-col hover:opacity-90 transition-opacity"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('card.ariaLabel', { title: name, creator: plan.author_name })}
    >
      <div className="relative" style={{ aspectRatio: '3/2', background: grad }}>
        <span
          className="absolute top-[10px] right-[10px] text-[9px] font-bold tracking-[0.1em] uppercase text-fg"
          style={{ background: 'var(--backdrop-50)', padding: '3px 8px', borderRadius: 2 }}
          aria-hidden
        >
          {t('badge')}
        </span>
        {plan.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        )}
      </div>
      <div className="p-sp-3 flex flex-col gap-[3px]">
        <p className="text-f-md font-semibold text-fg leading-snug">{name}</p>
        <div className="flex items-center gap-sp-3 text-f-xs text-muted">
          <span>{plan.author_name}</span>
          <span className="flex items-center gap-[3px]" aria-label={t('card.likesLabel', { count: plan.likes_count })}>
            <Heart size={11} strokeWidth={2} aria-hidden /> {plan.likes_count}
          </span>
          <span className="flex items-center gap-[3px]" aria-label={t('card.savesLabel', { count: plan.saves_count })}>
            <Bookmark size={11} strokeWidth={2} aria-hidden /> {plan.saves_count}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TopPlans() {
  const t = useTranslations('home.topPlans')
  const tCommon = useTranslations('common')
  const { topPlans, isLoading, isError, mutate } = useHome()

  return (
    <section className="mb-11" aria-label={t('title')}>
      <SectionHead title={t('title')} subtitle={t('subtitle')} seeAllLabel={t('seeAll')} />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-4" aria-label={tCommon('loading')} aria-busy="true">
          {[0, 1, 2].map(i => <PlanCardSkeleton key={i} />)}
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

      {!isLoading && !isError && topPlans.length === 0 && (
        <div
          className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
        >
          <Route size={32} strokeWidth={2} className="text-muted-2 mb-3" />
          <p className="text-f-base font-semibold text-fg mb-1">{t('empty.title')}</p>
          <p className="text-f-sm text-muted mb-4 max-w-[280px]">{t('empty.desc')}</p>
          <Link
            href="/plan"
            className="inline-flex items-center min-h-touch px-4 rounded-full text-f-sm font-semibold text-lav"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
          >
            {t('empty.cta')}
          </Link>
        </div>
      )}

      {!isLoading && !isError && topPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-4">
          {topPlans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} t={t} />
          ))}
        </div>
      )}
    </section>
  )
}
