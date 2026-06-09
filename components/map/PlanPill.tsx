'use client'

import { useTranslations } from 'next-intl'

interface Props {
  stopCount:  number
  onTap:      () => void
}

export default function PlanPill({ stopCount, onTap }: Props) {
  const t = useTranslations('map.planPill')

  if (stopCount === 0) return null

  return (
    <button
      onClick={onTap}
      aria-label={t('ariaLabel', { count: stopCount })}
      className="lg:hidden absolute bottom-sp-4 left-sp-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lav text-[13px] tabular-nums transition-opacity hover:opacity-90 active:opacity-75"
      style={{
        background: 'rgba(15,15,25,0.92)',
        border:     '1px solid rgba(196,168,224,0.5)',
      }}
    >
      {stopCount > 9 ? '9+' : stopCount}
    </button>
  )
}
