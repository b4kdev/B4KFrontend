'use client'

import { useTranslations } from 'next-intl'
import { Route, ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  stopCount: number
  expanded:  boolean
  onToggle:  () => void
}

export default function PlanStrip({ stopCount, expanded, onToggle }: Props) {
  const t = useTranslations('map.plan')

  return (
    <button
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? t('stripCollapse') : t('stripExpand')}
      className="w-full flex items-center gap-sp-2 px-sp-3 py-sp-3 shrink-0 text-left hover:bg-bg-3 transition-colors"
      style={{ borderTop: '1px solid var(--bdr)' }}
    >
      <Route size={14} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
      <span className="flex-1 text-fg text-xs font-semibold truncate">
        {t('title')}
      </span>
      <span className="text-f-xxs tabular-nums text-lav font-bold px-sp-1 py-0.5 rounded bg-lav-dim shrink-0">
        {stopCount}
      </span>
      {expanded
        ? <ChevronDown size={12} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
        : <ChevronUp   size={12} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
      }
    </button>
  )
}
