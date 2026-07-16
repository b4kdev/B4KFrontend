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
        className="shrink-0 flex items-center gap-sp-2 min-h-touch px-sp-5 text-f-md font-semibold text-energy rounded-none border border-[rgba(196,36,144,0.20)] bg-[rgba(196,36,144,0.05)] hover:bg-[rgba(196,36,144,0.12)] hover:border-energy transition-[background,border-color] duration-[80ms]"
      >
        <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
        {t('aiCta.button')}
      </button>
    </div>
  )
}
