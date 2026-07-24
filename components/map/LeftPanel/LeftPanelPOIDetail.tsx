'use client'

import { useTranslations } from 'next-intl'
import { Heart, Bookmark, Plus, Check, Clock, X, ImageOff } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import FieldImage from '@/components/ui/FieldImage'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  poi:          MapPoi
  isSaved:      boolean
  isInPlan:     boolean
  planFull:     boolean
  onAddToPlan:  () => void
  onToggleSave: () => void
  isLiked:      boolean
  onToggleLike: () => void
  onClose:      () => void
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function LeftPanelPOIDetail({
  poi, isSaved, isInPlan, planFull, onAddToPlan, onToggleSave, isLiked, onToggleLike, onClose,
}: Props) {
  const t = useTranslations('map.poiDetail')
  const name = getDisplayName(poi)
  const addDisabled = planFull && !isInPlan

  return (
    <div className="flex flex-col h-full overflow-y-auto themed-scrollbar">

      {/* Header — LP_04-07, LP_10 */}
      <div className="p-sp-4 flex flex-col gap-sp-3">

        {/* SC-24 — back to default state */}
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="self-end -mt-sp-1 -mr-sp-1 min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 transition-colors"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" style={{ opacity: 0.35 }} />
        </button>

        {/* LP_11-16 — Media (primary image, placeholder if none) */}
        {poi.primary_image_url ? (
          <FieldImage
            src={poi.primary_image_url}
            alt={name}
            domain={poi.display_domain ?? undefined}
            aspectRatio="4/3"
            className="-mx-sp-4 -mt-sp-2"
          />
        ) : (
          <div className="-mx-sp-4 -mt-sp-2 bg-bg-3 flex flex-col items-center justify-center gap-sp-2 overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <ImageOff size={28} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
            <span className="text-f-xs text-muted">{t('imagePending')}</span>
          </div>
        )}

        {/* LP_10 — Sponsored label */}
        {poi.is_partner && (
          <p className="divrow -mb-sp-1">
            {t('sponsored')}
          </p>
        )}

        {/* LP_04 — POI name */}
        <h2 className="text-fg font-display text-lg leading-tight line-clamp-2">
          {name}
        </h2>

        {/* LP_05 — Save count (DEC-31: no ratings) */}
        {poi.save_count != null && poi.save_count > 0 && (
          <p className="text-muted text-f-xs tabular-nums">
            {formatCount(poi.save_count)} {t('saves')}
          </p>
        )}

        {/* SC-24 (S-DEVEQK) — one-line description in core meta */}
        {poi.description && (
          <p className="text-muted text-f-sm leading-snug line-clamp-2">{poi.description}</p>
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
            'rounded-none font-body font-semibold text-sm',
            isInPlan
              ? 'bg-lav-dim text-lav cursor-default transition-none'
              : addDisabled
                ? 'bg-muted-3 text-muted cursor-not-allowed transition-none'
                : 'bg-fg text-bg hover:bg-royal-600 hover:text-fg transition-[background,color] duration-[80ms]',
          ].join(' ')}
        >
          {isInPlan
            ? <><Check size={16} strokeWidth={2} aria-hidden="true" />{t('added')}</>
            : <><Plus size={16} strokeWidth={2} aria-hidden="true" />{t('addToPlan')}</>
          }
        </button>

        {/* LP_09 — Like + Bookmark, side by side */}
        <div className="flex gap-sp-3">
          <button
            onClick={onToggleLike}
            aria-label={isLiked ? t('unlike') : t('like')}
            aria-pressed={isLiked}
            className="flex-1 min-h-touch flex items-center justify-center gap-sp-2 rounded-none font-medium bg-transparent text-muted border border-transparent hover:text-fg hover:border-muted-3 transition-[border-color,color] duration-[80ms]"
          >
            <Heart
              size={16}
              strokeWidth={2}
              fill={isLiked ? 'currentColor' : 'none'}
              className={isLiked ? 'text-danger' : 'text-muted'}
              aria-hidden="true"
            />
            <span className={isLiked ? 'text-fg' : 'text-muted'}>
              {isLiked ? t('liked') : t('like')}
            </span>
          </button>

          <button
            onClick={onToggleSave}
            aria-label={isSaved ? t('unsave') : t('save')}
            aria-pressed={isSaved}
            className="flex-1 min-h-touch flex items-center justify-center gap-sp-2 rounded-none font-medium bg-transparent text-muted border border-transparent hover:text-fg hover:border-muted-3 transition-[border-color,color] duration-[80ms]"
          >
            <Bookmark
              size={16}
              strokeWidth={2}
              fill={isSaved ? 'currentColor' : 'none'}
              className={isSaved ? 'text-lav' : 'text-muted'}
              aria-hidden="true"
            />
            <span className={isSaved ? 'text-fg' : 'text-muted'}>
              {isSaved ? t('saved') : t('save')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
