'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Sparkles } from 'lucide-react'
import type { ExploreCategory } from './ExplorePage'

const T_KEY: Record<ExploreCategory, string> = {
  'k-pop': 'kpop',
  'k-drama': 'kdrama',
  'k-beauty': 'kbeauty',
  'k-culture': 'kculture',
}

export default function ExploreAiCta({ category }: { category?: ExploreCategory }) {
  const t = useTranslations('explore')
  const router = useRouter()

  // Per-hub copy when a category is given; generic copy on the Explore hub landing.
  const text = category ? t(`aiCta.${T_KEY[category]}.text`) : t('aiCta.text')

  return (
    <div
      className="mt-sp-8 p-sp-6 flex flex-col sm:flex-row items-center gap-sp-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-f-lg font-semibold text-fg mb-[4px]">{text}</p>
      </div>
      <button
        onClick={() => router.push('/map?ai=open')}
        className="cta-ai shrink-0 gap-sp-2"
      >
        <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
        {t('aiCta.button')}
      </button>
    </div>
  )
}
