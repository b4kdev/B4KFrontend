'use client'

import { useTranslations } from 'next-intl'
import { MapPin, Clock } from 'lucide-react'
import { useBottomSheetSnap } from '@/hooks/useBottomSheetSnap'
import ItineraryPanelContent, { formatDuration } from './ItineraryPanelContent'
import type { ItineraryDetail } from '@/app/api/plans/[id]/route'

interface Props {
  itinerary: ItineraryDetail
  selectedPoiId: string | null
  isLiked: boolean
  isSaved: boolean
  isOwner: boolean
  planId: string
  onStopSelect: (poiId: string) => void
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onEdit: () => void
  onDeleteClick?: () => void
}

// SC-34 (S-BMGOFW) — 3-snap sheet, shared gesture hook (DEC-38) instead of the
// old hand-rolled peek/half/full pointer math. Content differs per snap:
// peek = title + stop count + duration only (~80px) · mid = stop list (notes
// clamped, no Related) · full = same list with untruncated notes + Related.
export default function ItineraryMobileSheet({
  itinerary,
  selectedPoiId,
  isLiked,
  isSaved,
  isOwner,
  planId,
  onStopSelect,
  onLike,
  onSave,
  onShare,
  onEdit,
  onDeleteClick,
}: Props) {
  const t = useTranslations('itinerary')

  // Always-present content sheet over the map — nothing to dismiss to, so a
  // drag/fling past peek just has nowhere further to go.
  const { sheetRef, snap, handleProps, sheetStyle } = useBottomSheetSnap({
    open: true,
    initialSnap: 'peek',
    onDismiss: () => {},
  })

  const durationLabel = formatDuration(t, itinerary.total_duration_min)

  return (
    <div
      ref={sheetRef}
      className="absolute inset-x-0 bottom-0 z-20 lg:hidden rounded-t-2xl flex flex-col bg-bg-2"
      style={{ ...sheetStyle, height: '95%', borderTop: '1px solid var(--bdr)' }}
      role="dialog"
      aria-label={t('sheet.ariaLabel')}
    >
      {/* Drag handle */}
      <div
        {...handleProps}
        className="flex-none h-sp-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        aria-label={t('sheet.handle')}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="w-8 h-1 rounded-full" style={{ background: 'var(--muted-2)' }} aria-hidden="true" />
      </div>

      {snap === 'peek' ? (
        /* Peek — title + stop count + duration only, ~80px total with the handle */
        <div className="px-sp-4 pb-sp-3 flex flex-col gap-[2px] min-w-0">
          <p className="text-f-md font-semibold text-fg leading-snug truncate">{itinerary.title}</p>
          <div className="flex items-center gap-sp-3">
            <span className="flex items-center gap-1 text-f-xs text-muted">
              <MapPin size={11} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              {t('stats.stops', { count: itinerary.stops.length })}
            </span>
            <span className="flex items-center gap-1 text-f-xs text-muted">
              <Clock size={11} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              {durationLabel}
            </span>
          </div>
        </div>
      ) : (
        <ItineraryPanelContent
          itinerary={itinerary}
          selectedPoiId={selectedPoiId}
          isLiked={isLiked}
          isSaved={isSaved}
          isOwner={isOwner}
          planId={planId}
          onStopSelect={onStopSelect}
          onLike={onLike}
          onSave={onSave}
          onShare={onShare}
          onEdit={onEdit}
          onDeleteClick={onDeleteClick}
          snap={snap}
        />
      )}
    </div>
  )
}
