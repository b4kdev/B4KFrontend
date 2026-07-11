'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Sparkles } from 'lucide-react'

export default function ExploreAiCta() {
  const t = useTranslations('explore')
  const router = useRouter()

  return (
    <div
      className="mt-sp-8 p-sp-6 flex flex-col sm:flex-row items-center gap-sp-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-f-lg font-semibold text-fg mb-[4px]">{t('aiCta.text')}</p>
      </div>
      <button
        onClick={() => router.push('/map?ai=1')}
        className="shrink-0 flex items-center gap-sp-2 min-h-touch px-sp-5 text-f-md font-semibold text-bg rounded-none"
        style={{ background: 'var(--lav)' }}
      >
        <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
        {t('aiCta.button')}
      </button>
    </div>
  )
}
