'use client'

import { useTranslations } from 'next-intl'
import { Heart, Plus, Check, Clock } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  poi:          MapPoi
  isSaved:      boolean
  isInPlan:     boolean
  planFull:     boolean
  onAddToPlan:  () => void
  onToggleSave: () => void
}

function Stars({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className="text-sm leading-none tracking-tight" aria-hidden="true">
      <span className="text-warning">{'★'.repeat(full)}</span>
      <span className="text-muted-2">{'☆'.repeat(empty)}</span>
    </span>
  )
}

export default function LeftPanelPOIDetail({
  poi, isSaved, isInPlan, planFull, onAddToPlan, onToggleSave,
}: Props) {
  const t = useTranslations('map.poiDetail')
  const name = getDisplayName(poi)
  const addDisabled = planFull && !isInPlan

  return (
    <div className="flex flex-col h-full overflow-y-auto themed-scrollbar">

      {/* Header — LP_04-07, LP_10 */}
      <div className="p-sp-4 flex flex-col gap-sp-3" style={{ borderBottom: '1px solid var(--bdr)' }}>

        {/* LP_10 — Sponsored label */}
        {poi.is_partner && (
          <p className="text-[10px] text-muted uppercase tracking-widest -mb-sp-1">
            {t('sponsored')}
          </p>
        )}

        {/* LP_04 — POI name */}
        <h2 className="text-fg font-display font-bold text-lg leading-tight line-clamp-2">
          {name}
        </h2>

        {/* LP_05 — Star rating */}
        {poi.rating != null && (
          <div className="flex items-center gap-sp-2">
            <Stars rating={poi.rating} />
            <span className="text-fg text-sm font-semibold tabular-nums">{poi.rating.toFixed(1)}</span>
            {poi.review_count != null && (
              <span className="text-muted text-xs">
                ({poi.review_count.toLocaleString()} {t('reviews')})
              </span>
            )}
          </div>
        )}

        {/* LP_06 — Category + district + open status */}
        <div className="flex flex-wrap items-center gap-sp-2">
          <span className="px-sp-2 py-0.5 rounded-full bg-lav-dim text-lav text-xs font-medium">
            {poi.display_domain}
          </span>
          {poi.display_region_detail && (
            <span className="text-muted text-xs">{poi.display_region_detail}</span>
          )}
          {poi.is_open != null && (
            <span
              className={`text-xs font-medium ${poi.is_open ? 'text-success' : 'text-danger'}`}
              aria-label={poi.is_open ? t('openNow') : t('closed')}
            >
              {poi.is_open ? t('openNow') : t('closed')}
            </span>
          )}
        </div>

        {/* LP_07 — Opening hours */}
        {poi.hours_open && poi.hours_close && (
          <div className="flex items-center gap-sp-2 text-muted text-xs">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            <span>{poi.hours_open}–{poi.hours_close}</span>
          </div>
        )}
      </div>

      {/* Actions — LP_08, LP_09 */}
      <div className="p-sp-4 flex flex-col gap-sp-3">

        {/* LP_08 — Add to Plan */}
        <button
          onClick={onAddToPlan}
          disabled={addDisabled}
          aria-disabled={addDisabled}
          title={addDisabled ? t('planFull') : undefined}
          className={[
            'w-full min-h-touch flex items-center justify-center gap-sp-2',
            'rounded-xl font-body font-semibold text-sm transition-all',
            isInPlan
              ? 'bg-lav-dim text-lav cursor-default'
              : addDisabled
                ? 'bg-muted-3 text-muted cursor-not-allowed'
                : 'bg-lav text-bg hover:opacity-90 active:opacity-75',
          ].join(' ')}
        >
          {isInPlan
            ? <><Check size={16} strokeWidth={2} aria-hidden="true" />{t('added')}</>
            : <><Plus size={16} strokeWidth={2} aria-hidden="true" />{t('addToPlan')}</>
          }
        </button>

        {/* LP_09 — Bookmark */}
        <button
          onClick={onToggleSave}
          aria-label={isSaved ? t('unsave') : t('save')}
          aria-pressed={isSaved}
          className="w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-xl text-sm font-medium transition-colors bg-overlay-10 hover:bg-muted-3"
        >
          <Heart
            size={16}
            strokeWidth={2}
            fill={isSaved ? 'currentColor' : 'none'}
            className={isSaved ? 'text-danger' : 'text-muted'}
            aria-hidden="true"
          />
          <span className={isSaved ? 'text-fg' : 'text-muted'}>
            {isSaved ? t('saved') : t('save')}
          </span>
        </button>
      </div>
    </div>
  )
}
