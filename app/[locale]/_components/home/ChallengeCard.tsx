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

  if (isLoading || !data) return null

  // S-FYFMTY / AG-1 (locked): this CTA is navigation, not a write — it never
  // gates. The mission page itself gates at the actual user-keyed write.
  function handleCta() {
    router.push(data!.cta_href)
  }

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('ariaLabel')}>
      <div
        className="p-sp-6 flex flex-col lg:flex-row lg:items-center gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--lav-border)' }}
      >
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--lav-dim)' }}
          aria-hidden="true"
        >
          <Trophy size={22} strokeWidth={2} className="text-lav" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-f-xxs font-bold tracking-[0.1em] uppercase text-lav mb-[4px]">{t('label')}</p>
          <p className="text-f-lg font-semibold text-fg mb-[4px]">{data.title}</p>
          <p className="text-f-sm text-muted leading-relaxed">{data.description}</p>
        </div>
        <div className="flex flex-col gap-[3px] shrink-0">
          <p className="text-f-xxs text-muted uppercase tracking-[0.08em]">{t('badgeReward')}</p>
          <p className="text-f-sm font-semibold text-fg">{data.badge_name}</p>
          <button
            onClick={handleCta}
            className="mt-sp-2 flex items-center gap-1 text-f-sm font-semibold text-lav hover:opacity-80 transition-opacity duration-[80ms] min-h-touch"
          >
            {t('cta')}
            <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
