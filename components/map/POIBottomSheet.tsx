'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X, Heart, Plus, Check, Clock } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  poi:          MapPoi
  isOpen:       boolean
  isSaved:      boolean
  isInPlan:     boolean
  planFull:     boolean
  onAddToPlan:  () => void
  onToggleSave: () => void
  onDismiss:    () => void
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function POIBottomSheet({
  poi, isOpen, isSaved, isInPlan, planFull, onAddToPlan, onToggleSave, onDismiss,
}: Props) {
  const t = useTranslations('map.poiDetail')
  const sheetRef = useRef<HTMLDivElement>(null)
  const addDisabled = planFull && !isInPlan

  // Trap focus when open
  useEffect(() => {
    if (!isOpen) return
    const el = sheetRef.current
    if (!el) return
    const firstFocusable = el.querySelector<HTMLElement>('button, [tabindex="0"]')
    firstFocusable?.focus()
  }, [isOpen, poi])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onDismiss])

  const name = getDisplayName(poi)

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'lg:hidden fixed inset-0 z-30 transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'var(--backdrop-50)' }}
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className={[
          'lg:hidden fixed bottom-14 left-0 right-0 z-40',
          'bg-bg-2 rounded-t-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-sp-2 pb-sp-1" aria-hidden="true">
          <div className="w-8 h-1 rounded-full bg-muted-2" />
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label={t('dismiss')}
          className="absolute top-sp-3 right-sp-3 min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="px-sp-4 pb-sp-6">

          {/* Sponsored label */}
          {poi.is_partner && (
            <p className="text-f-xxs text-muted uppercase tracking-widest mb-sp-1">
              {t('sponsored')}
            </p>
          )}

          {/* POI name */}
          <h2 className="text-fg font-display font-bold text-xl leading-tight line-clamp-2 mb-sp-3 pr-sp-8">
            {name}
          </h2>

          {/* Save count (DEC-31: no ratings) */}
          {poi.save_count != null && poi.save_count > 0 && (
            <p className="text-muted text-f-xs mb-sp-3 tabular-nums">
              {formatCount(poi.save_count)} {t('saves')}
            </p>
          )}

          {/* Domain chip + region + open status */}
          <div className="flex flex-wrap items-center gap-sp-2 mb-sp-3">
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

          {/* Hours */}
          {poi.hours_open && poi.hours_close && (
            <div className="flex items-center gap-sp-2 text-muted text-xs mb-sp-4">
              <Clock size={12} strokeWidth={2} aria-hidden="true" />
              <span>{poi.hours_open}–{poi.hours_close}</span>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-sp-3">

            {/* Add to Plan — D02 mobile override */}
            <button
              onClick={onAddToPlan}
              disabled={addDisabled}
              aria-disabled={addDisabled}
              title={addDisabled ? t('planFull') : undefined}
              className={[
                'w-full min-h-touch flex items-center justify-center gap-sp-2',
                'rounded-xl font-semibold text-sm transition-all',
                isInPlan
                  ? 'bg-lav-dim text-lav cursor-default'
                  : addDisabled
                    ? 'bg-muted-3 text-muted cursor-not-allowed'
                    : 'bg-lav text-bg hover:opacity-90 active:opacity-75',
              ].join(' ')}
            >
              {isInPlan
                ? <><Check size={16} strokeWidth={2} aria-hidden="true" />{t('added')}</>
                : <><Plus  size={16} strokeWidth={2} aria-hidden="true" />{t('addToPlan')}</>
              }
            </button>

            {/* Save */}
            <button
              onClick={onToggleSave}
              aria-label={isSaved ? t('unsave') : t('save')}
              aria-pressed={isSaved}
              className="w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-xl text-sm font-medium transition-colors bg-overlay-10 hover:bg-muted-3"
              style={{ border: '1px solid var(--bdr)' }}
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
      </div>
    </>
  )
}
