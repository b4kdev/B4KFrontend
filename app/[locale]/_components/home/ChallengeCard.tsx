'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import useSWR from 'swr'
import { Trophy, ArrowRight } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import type { HomeChallengeData } from '@/app/api/home/challenge/route'

export default function ChallengeCard() {
  const t = useTranslations('home.challenge')
  const router = useRouter()
  const { data, isLoading } = useSWR<HomeChallengeData>('/api/home/challenge', fetcher)

  // S-FYFMTY / AG-1 (locked): this CTA is navigation, not a write — it never
  // gates. The mission page itself gates at the actual user-keyed write.
  function handleCta() {
    router.push(data!.cta_href)
  }

  if (isLoading) {
    return (
      <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-hidden="true">
        <div
          className="p-sp-6 flex flex-col lg:flex-row lg:items-center gap-sp-4 animate-pulse"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
        >
          <span className="w-12 h-12 rounded-full shrink-0 bg-muted-3" />
          <div className="flex-1 min-w-0 flex flex-col gap-sp-2">
            <div className="h-[11px] w-1/4 bg-muted-3" />
            <div className="h-[15px] w-2/3 bg-muted-3" />
            <div className="h-[12px] w-full bg-muted-3" />
          </div>
          <div className="flex flex-col gap-[3px] shrink-0 w-[120px]">
            <div className="h-[10px] w-2/3 bg-muted-3" />
            <div className="h-[12px] w-1/2 bg-muted-3" />
            <div className="h-[12px] w-1/3 mt-sp-2 bg-muted-3" />
          </div>
        </div>
      </section>
    )
  }

  if (!data) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('ariaLabel')}>
      <div
        className="p-sp-6 flex flex-col lg:flex-row lg:items-center gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-bg-3"
          aria-hidden="true"
        >
          <Trophy size={22} strokeWidth={2} className="text-fg" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-f-xxs font-bold tracking-[0.1em] uppercase text-muted mb-[4px]">{t('label')}</p>
          <p className="text-f-lg font-semibold text-fg mb-[4px] line-clamp-1">{data.title}</p>
          <p className="text-f-sm text-muted leading-relaxed line-clamp-2">{data.description}</p>
        </div>
        <div className="flex flex-col gap-[3px] shrink-0 max-w-[120px]">
          <p className="text-f-xxs text-muted uppercase tracking-[0.08em]">{t('badgeReward')}</p>
          <p className="text-f-sm font-semibold text-fg truncate">{data.badge_name}</p>
          <button
            onClick={handleCta}
            className="mt-sp-2 flex items-center gap-1 text-f-sm font-semibold text-fg hover:opacity-80 transition-opacity duration-[80ms] min-h-touch"
          >
            {t('cta')}
            <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
