'use client'

import { useTranslations } from 'next-intl'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const t = useTranslations('boundary.offline')

  return (
    <div
      className="min-h-[calc(100vh-50px)] lg:min-h-[calc(100vh-56px)] flex items-center justify-center px-sp-6"
      aria-label={t('title')}
    >
      <div
        className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-8 rounded-none w-full max-w-[400px]"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <WifiOff size={48} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-5" />
        <h1 className="font-display text-fg text-f-display-tile mb-sp-3">
          {t('title')}
        </h1>
        <p className="text-f-md text-muted max-w-[280px] leading-relaxed mb-sp-6">
          {t('desc')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-sp-2 rounded-none bg-transparent text-muted font-semibold text-f-sm border border-transparent min-h-touch px-sp-5 hover:text-fg hover:border-muted-3 transition-[border-color,color] duration-[80ms]"
        >
          <RefreshCw size={14} strokeWidth={2} />
          {t('retry')}
        </button>
      </div>
    </div>
  )
}
