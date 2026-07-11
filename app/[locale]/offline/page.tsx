'use client'

import { useTranslations } from 'next-intl'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const t = useTranslations('boundary.offline')

  return (
    <main
      className="min-h-[calc(100vh-50px)] flex items-center justify-center px-sp-6"
      aria-label={t('title')}
    >
      <div
        className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-8 rounded-xl w-full max-w-[400px]"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <WifiOff size={48} strokeWidth={2} className="text-muted-2 mb-sp-5" />
        <p className="font-display font-black text-fg text-[clamp(18px,2vw,24px)] mb-sp-3">
          {t('title')}
        </p>
        <p className="text-f-md text-muted max-w-[280px] leading-relaxed mb-sp-6">
          {t('desc')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-lg text-f-md font-semibold text-lav min-h-touch hover:text-fg transition-colors"
          style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
        >
          <RefreshCw size={14} strokeWidth={2} />
          {t('retry')}
        </button>
      </div>
    </main>
  )
}
