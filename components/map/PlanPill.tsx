'use client'

import { useTranslations } from 'next-intl'
import { Route } from 'lucide-react'

interface Props {
  stopCount:  number
  fromAi?:    boolean
  onTap:      () => void
}

export default function PlanPill({ stopCount, fromAi = false, onTap }: Props) {
  const t = useTranslations('map.planPill')

  if (stopCount === 0) return null

  // M20: pill with "Plan · X stops" label (was a bare count circle).
  // SC-25 — "AI Plan · X stops" once the plan has any FL3-added stop.
  return (
    <button
      onClick={onTap}
      aria-label={t('ariaLabel', { count: stopCount })}
      className="lg:hidden absolute bottom-sp-4 left-sp-3 z-20 h-touch px-sp-4 rounded-full flex items-center gap-sp-2 font-semibold text-lav-map text-f-sm transition-opacity hover:opacity-90 active:opacity-75"
      style={{
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        border:     '1px solid color-mix(in srgb, var(--lav-map) 50%, transparent)',
      }}
    >
      <Route size={16} strokeWidth={2} aria-hidden="true" />
      <span className="tabular-nums">{t(fromAi ? 'aiLabel' : 'label', { count: stopCount })}</span>
    </button>
  )
}
