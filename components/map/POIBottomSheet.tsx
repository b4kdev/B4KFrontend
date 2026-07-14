'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, Heart, Plus, Check, Clock, Share2, MapPin, ExternalLink, ImageOff } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useBottomSheetSnap, type SheetSnap } from '@/hooks/useBottomSheetSnap'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  poi:          MapPoi
  isOpen:       boolean
  isSaved:      boolean
  isLiked:      boolean
  isInPlan:     boolean
  planFull:     boolean
  onAddToPlan:  () => void
  onToggleSave: () => void
  onToggleLike: () => void
  onDismiss:    () => void
  onSnapChange?: (snap: SheetSnap) => void
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function POIBottomSheet({
  poi, isOpen, isSaved, isLiked, isInPlan, planFull,
  onAddToPlan, onToggleSave, onToggleLike, onDismiss, onSnapChange,
}: Props) {
  const t = useTranslations('map.poiDetail')
  const addDisabled = planFull && !isInPlan
  const name = getDisplayName(poi)

  const { sheetRef, snap, handleProps, sheetStyle } = useBottomSheetSnap({
    open: isOpen,
    initialSnap: 'mid',
    onDismiss,
    onSnapChange,
  })

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onDismiss])

  async function handleShare() {
    const url = `${window.location.origin}/map?poi=${poi.poi_id}`
    try {
      if (navigator.share) await navigator.share({ title: name, url })
      else await navigator.clipboard.writeText(url)
    } catch { /* user cancelled share / clipboard blocked — no-op */ }
  }

  return (
    <>
      {/* Backdrop — only at mid/full; peek keeps the map interactive */}
      <div
        className={[
          'lg:hidden fixed inset-0 z-30 transition-opacity duration-200',
          isOpen && snap !== 'peek' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'var(--backdrop-50)' }}
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Sheet — 3-snap (peek/mid/full) */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal={snap !== 'peek'}
        aria-label={name}
        className="lg:hidden fixed bottom-14 left-0 right-0 z-40 h-[85vh] flex flex-col bg-bg-2 rounded-none"
        style={{ ...sheetStyle, borderTop: '1px solid var(--bdr)' }}
      >
        {/* Peek zone: drag handle + header (title + Share + dismiss) — owns the gesture */}
        <div className="shrink-0" style={{ touchAction: 'none' }} {...handleProps}>
          <div className="flex justify-center pt-sp-2 pb-sp-1" aria-hidden="true">
            <div className="w-8 h-1 rounded-full bg-muted-2" />
          </div>
          <div className="flex items-center gap-sp-2 px-sp-4 pb-sp-2 min-h-touch">
            <h2 className="flex-1 text-fg font-display font-bold text-f-2xl leading-tight truncate">
              {name}
            </h2>
            <button
              onClick={handleShare}
              aria-label={t('share')}
              className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors shrink-0"
            >
              <Share2 size={18} strokeWidth={2} />
            </button>
            <button
              onClick={onDismiss}
              aria-label={t('dismiss')}
              className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable body — revealed at mid (CTAs) and full (detail) */}
        <div
          className="flex-1 overflow-y-auto px-sp-4 pb-sp-6"
          style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
        >
          {/* LP_11-16 — Media (primary image, placeholder if none) */}
          <div className="-mx-sp-4 mb-sp-3 bg-bg-3 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {poi.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poi.primary_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
            )}
          </div>

          {/* Sponsored */}
          {poi.is_partner && (
            <p className="text-f-xxs text-muted uppercase tracking-widest mb-sp-2">{t('sponsored')}</p>
          )}

          {/* Save count (DEC-31: no ratings) */}
          {poi.save_count != null && poi.save_count > 0 && (
            <p className="text-muted text-f-xs mb-sp-3 tabular-nums">
              {formatCount(poi.save_count)} {t('saves')}
            </p>
          )}

          {/* Domain chip + region + open status */}
          <div className="flex flex-wrap items-center gap-sp-2 mb-sp-3">
            <span className="px-sp-2 py-0.5 rounded-full bg-lav-dim text-lav text-f-xs font-medium">
              {poi.display_domain}
            </span>
            {poi.display_region_detail && (
              <span className="text-muted text-f-xs">{poi.display_region_detail}</span>
            )}
            {poi.is_open != null && (
              <span
                className={`text-f-xs font-medium ${poi.is_open ? 'text-success' : 'text-danger'}`}
                aria-label={poi.is_open ? t('openNow') : t('closed')}
              >
                {poi.is_open ? t('openNow') : t('closed')}
              </span>
            )}
          </div>

          {/* Hours */}
          {poi.hours_open && poi.hours_close && (
            <div className="flex items-center gap-sp-2 text-muted text-f-xs mb-sp-4">
              <Clock size={12} strokeWidth={2} aria-hidden="true" />
              <span>{poi.hours_open}–{poi.hours_close}</span>
            </div>
          )}

          {/* CTAs — mid snap (S-DEVEQK): Add to Plan · Save · Like */}
          <div className="flex flex-col gap-sp-3">
            <button
              onClick={onAddToPlan}
              disabled={addDisabled}
              aria-disabled={addDisabled}
              title={addDisabled ? t('planFull') : undefined}
              className={[
                'w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-none font-semibold text-f-sm transition-all',
                isInPlan
                  ? 'bg-lav-dim text-lav cursor-default'
                  : addDisabled
                    ? 'bg-muted-3 text-muted cursor-not-allowed'
                    : 'bg-lav text-bg hover:opacity-90 active:opacity-75',
              ].join(' ')}
            >
              {isInPlan
                ? <><Check size={16} strokeWidth={2} aria-hidden="true" />{t('added')}</>
                : <><Plus  size={16} strokeWidth={2} aria-hidden="true" />{t('addToPlan')}</>}
            </button>

            <div className="flex gap-sp-3">
              <button
                onClick={onToggleSave}
                aria-label={isSaved ? t('unsave') : t('save')}
                aria-pressed={isSaved}
                className="flex-1 min-h-touch flex items-center justify-center gap-sp-2 rounded-none text-f-sm font-medium transition-colors bg-overlay-10 hover:bg-muted-3"
                style={{ border: '1px solid var(--bdr)' }}
              >
                <Heart
                  size={16} strokeWidth={2}
                  fill={isSaved ? 'currentColor' : 'none'}
                  className={isSaved ? 'text-danger' : 'text-muted'}
                  aria-hidden="true"
                />
                <span className={isSaved ? 'text-fg' : 'text-muted'}>{isSaved ? t('saved') : t('save')}</span>
              </button>

              <button
                onClick={onToggleLike}
                aria-label={isLiked ? t('unlike') : t('like')}
                aria-pressed={isLiked}
                className="flex-1 min-h-touch flex items-center justify-center gap-sp-2 rounded-none text-f-sm font-medium transition-colors bg-overlay-10 hover:bg-muted-3"
                style={{ border: '1px solid var(--bdr)' }}
              >
                <Heart
                  size={16} strokeWidth={2}
                  fill={isLiked ? 'currentColor' : 'none'}
                  className={isLiked ? 'text-lav' : 'text-muted'}
                  aria-hidden="true"
                />
                <span className={isLiked ? 'text-fg' : 'text-muted'}>{isLiked ? t('liked') : t('like')}</span>
              </button>
            </div>
          </div>

          {/* Full snap: description + address + website */}
          {poi.description && (
            <p className="text-fg text-f-sm leading-relaxed mt-sp-5">{poi.description}</p>
          )}
          {poi.address && (
            <div className="flex items-start gap-sp-2 text-muted text-f-xs mt-sp-4">
              <MapPin size={14} strokeWidth={2} aria-hidden="true" className="shrink-0 mt-0.5" />
              <span>{poi.address}</span>
            </div>
          )}
          {poi.website_url && /^https?:\/\//.test(poi.website_url) && (
            <a
              href={poi.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-sp-2 text-lav text-f-sm font-medium mt-sp-4 min-h-touch"
            >
              <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
              {t('website')}
            </a>
          )}
        </div>
      </div>
    </>
  )
}
