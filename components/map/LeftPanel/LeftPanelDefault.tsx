'use client'

import { useTranslations } from 'next-intl'
import { MapPin, Bookmark, AlertTriangle, Plus, Check } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { MapPoi } from '@/hooks/useMapPois'

const REGIONS   = ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Gyeongju'] as const
const CATEGORIES = ['Palaces', 'Temples', 'Cafes', 'Parks', 'Restaurants', 'Hotels', 'Shopping', 'Museums'] as const

// SC-30 (LP_01–10, S-ZKAIGJ) — cold-start fallback is popular POIs (no
// behavior-signal tracking exists yet), so mock ranking = quality_score desc.
const RECOMMENDED_COUNT = 8

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

interface Props {
  pois:           MapPoi[]
  isLoading:      boolean
  isError:        boolean
  activeRegion:   string | null
  activeFilters:  string[]
  onRegionToggle: (region: string) => void
  onFilterToggle: (filter: string) => void
  isSaved:        (id: string) => boolean
  onSelectPoi:    (id: string) => void
  onToggleSave:   (poi: MapPoi) => void
  onOpenSaved:    () => void
  isInPlan:       (id: string) => boolean
  planFull:       boolean
  onAddToPlan:    (id: string) => void
}

export default function LeftPanelDefault({
  pois, isLoading, isError,
  activeRegion, activeFilters, onRegionToggle, onFilterToggle,
  isSaved, onSelectPoi, onToggleSave, onOpenSaved,
  isInPlan, planFull, onAddToPlan,
}: Props) {
  const t = useTranslations('map')
  const recommended = [...pois].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0)).slice(0, RECOMMENDED_COUNT)

  return (
    <div className="flex flex-col h-full overflow-y-auto themed-scrollbar">
      {/* View Saved entry point — opens the map-embedded Saved Hub */}
      <div className="flex justify-end p-sp-2">
        <button
          type="button"
          onClick={onOpenSaved}
          aria-label={t('leftPanel.viewSaved')}
          title={t('leftPanel.viewSaved')}
          className="group flex items-center justify-center min-w-touch min-h-touch rounded-none text-fg hover:text-lav hover:bg-overlay-10 transition-colors"
        >
          <Bookmark size={24} strokeWidth={2} aria-hidden="true" className="opacity-[0.35] group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* LP_01 — Region list */}
      <div className="p-sp-4">
        <p className="divrow mb-sp-3">
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
                  'catalogue-row text-left w-full min-h-touch px-sp-3 rounded-none text-sm font-medium',
                  isActive
                    ? 'bg-lav-dim text-lav'
                    : 'text-fg',
                ].join(' ')}
              >
                {t(`regions.${region.toLowerCase() as Lowercase<typeof region>}`)}
              </button>
            )
          })}
          <button className="catalogue-row text-left w-full min-h-touch px-sp-3 rounded-none text-sm text-muted hover:text-fg hover:bg-overlay-10">
            {t('regions.more')}
          </button>
        </div>
      </div>

      {/* LP_02 + LP_03 — Category filter chips */}
      <div className="p-sp-4">
        <p className="divrow mb-sp-3">
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

      {/* LP_04–10 — Recommended POI list (S-ZKAIGJ: cold-start = popular fallback) */}
      <div className="p-sp-4 flex-1">
        <p className="divrow mb-sp-3">
          {t('recommended.title')}
        </p>

        {isLoading && (
          <div className="flex flex-col gap-sp-2" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-sp-2 animate-pulse">
                <div className="w-12 h-12 shrink-0 bg-muted-3" />
                <div className="flex-1 flex flex-col gap-1 justify-center">
                  <div className="h-[12px] w-4/5 bg-muted-3" />
                  <div className="h-[10px] w-1/2 bg-muted-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center text-center gap-sp-2 py-sp-6">
            <AlertTriangle size={20} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
            <p className="text-f-xs text-muted">{t('recommended.error')}</p>
          </div>
        )}

        {!isLoading && !isError && recommended.length === 0 && (
          <p className="text-f-xs text-muted py-sp-4 text-center">{t('recommended.empty')}</p>
        )}

        {!isLoading && !isError && recommended.length > 0 && (
          <div className="flex flex-col gap-1">
            {recommended.map(poi => {
              const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
              const saved = isSaved(poi.poi_id)
              const inPlan = isInPlan(poi.poi_id)
              const addDisabled = planFull && !inPlan
              return (
                <div
                  key={poi.poi_id}
                  className="flex items-center gap-sp-2 py-1 hover:bg-overlay-10 transition-colors"
                >
                  <button
                    onClick={() => onSelectPoi(poi.poi_id)}
                    className="flex items-center gap-sp-2 flex-1 min-w-0 text-left"
                    aria-label={t('recommended.cardAriaLabel', { name, region: poi.display_region ?? '' })}
                  >
                    <span className="w-12 h-12 shrink-0 bg-bg-3 flex items-center justify-center overflow-hidden">
                      <MapPin size={16} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col gap-[2px]">
                      <span className="text-f-sm font-medium text-fg leading-snug line-clamp-1">{name}</span>
                      <span className="flex items-center gap-[3px] text-f-xxs text-muted">
                        <MapPin size={9} strokeWidth={2} aria-hidden="true" />
                        <span className="line-clamp-1">{poi.display_region}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatCount(poi.save_count ?? 0)}</span>
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => onAddToPlan(poi.poi_id)}
                    disabled={addDisabled}
                    aria-disabled={addDisabled}
                    aria-pressed={inPlan}
                    title={addDisabled ? t('poiDetail.planFull') : undefined}
                    aria-label={inPlan ? t('poiDetail.added') : t('poiDetail.addToPlan')}
                    className={[
                      'shrink-0 w-8 h-8 flex items-center justify-center rounded-none transition-colors',
                      inPlan
                        ? 'text-lav cursor-default'
                        : addDisabled
                          ? 'text-muted-3 cursor-not-allowed'
                          : 'text-muted-2 hover:bg-overlay-10 hover:text-fg',
                    ].join(' ')}
                  >
                    {inPlan
                      ? <Check size={16} strokeWidth={2} aria-hidden="true" />
                      : <Plus size={16} strokeWidth={2} aria-hidden="true" />}
                  </button>
                  <button
                    onClick={() => onToggleSave(poi)}
                    aria-pressed={saved}
                    aria-label={saved ? t('recommended.unsave') : t('recommended.save')}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-none hover:bg-overlay-10 transition-colors"
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={2}
                      className={saved ? 'text-lav' : 'text-muted-2'}
                      fill={saved ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
