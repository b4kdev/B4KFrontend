'use client'

import { useTranslations } from 'next-intl'

const REGIONS   = ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Gyeongju'] as const
const CATEGORIES = ['Palaces', 'Temples', 'Cafes', 'Parks', 'Restaurants', 'Hotels', 'Shopping', 'Museums'] as const

interface Props {
  activeRegion:   string | null
  activeFilters:  string[]
  onRegionToggle: (region: string) => void
  onFilterToggle: (filter: string) => void
}

export default function LeftPanelDefault({ activeRegion, activeFilters, onRegionToggle, onFilterToggle }: Props) {
  const t = useTranslations('map')

  return (
    <div className="flex flex-col h-full overflow-y-auto themed-scrollbar">
      {/* LP_01 — Region list */}
      <div className="p-sp-4" style={{ borderBottom: '1px solid var(--bdr)' }}>
        <p className="text-f-xxs font-semibold uppercase tracking-widest text-muted mb-sp-3">
          {t('regions.title')}
        </p>
        <div className="flex flex-col gap-0.5">
          {REGIONS.map(region => {
            const isActive = activeRegion === region
            return (
              <button
                key={region}
                onClick={() => onRegionToggle(region)}
                aria-pressed={isActive}
                className={[
                  'text-left w-full min-h-touch px-sp-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-lav-dim text-lav'
                    : 'text-fg hover:bg-overlay-10',
                ].join(' ')}
              >
                {t(`regions.${region.toLowerCase() as Lowercase<typeof region>}`)}
              </button>
            )
          })}
          <button className="text-left w-full min-h-touch px-sp-3 rounded-lg text-sm text-muted hover:text-fg hover:bg-overlay-10 transition-colors">
            {t('regions.more')}
          </button>
        </div>
      </div>

      {/* LP_02 + LP_03 — Category filter chips */}
      <div className="p-sp-4">
        <p className="text-f-xxs font-semibold uppercase tracking-widest text-muted mb-sp-3">
          {t('filters.title')}
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const isActive = activeFilters.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => onFilterToggle(cat)}
                aria-pressed={isActive}
                className={[
                  'px-sp-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  'min-h-[32px]',
                  isActive
                    ? 'bg-lav text-bg'
                    : 'bg-overlay-10 text-muted hover:text-fg',
                ].join(' ')}
              >
                {t(`filters.${cat.toLowerCase() as Lowercase<typeof cat>}`)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
