'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import ItineraryPanelContent from './ItineraryPanelContent'
import type { ItineraryDetail } from '@/app/api/itinerary/[id]/route'

interface Props {
  itinerary: ItineraryDetail
  selectedPoiId: string | null
  isLiked: boolean
  isSaved: boolean
  isOwner: boolean
  onStopSelect: (poiId: string) => void
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onEdit: () => void
  onDeleteClick?: () => void
}

const SNAP_PCT = { peek: 70, half: 45, full: 10 } as const
type SnapKey = keyof typeof SNAP_PCT

export default function ItineraryMobileSheet({
  itinerary,
  selectedPoiId,
  isLiked,
  isSaved,
  isOwner,
  onStopSelect,
  onLike,
  onSave,
  onShare,
  onEdit,
  onDeleteClick,
}: Props) {
  const t = useTranslations('itinerary')
  const [snap, setSnap] = useState<SnapKey>('peek')
  const [dragY, setDragY] = useState<number | null>(null)
  const dragStart = useRef<{ clientY: number; basePct: number } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const currentPct = dragY !== null ? dragY : SNAP_PCT[snap]
  const isDragging = dragY !== null

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { clientY: e.clientY, basePct: SNAP_PCT[snap] }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return
    const dy = e.clientY - dragStart.current.clientY
    const vh = window.innerHeight
    const pct = Math.max(5, Math.min(82, dragStart.current.basePct + (dy / vh) * 100))
    setDragY(pct)
  }

  function handlePointerUp() {
    if (!dragStart.current || dragY === null) {
      dragStart.current = null
      return
    }
    const snapKeys: SnapKey[] = ['peek', 'half', 'full']
    const nearest = snapKeys.reduce<SnapKey>(
      (best, key) =>
        Math.abs(SNAP_PCT[key] - dragY) < Math.abs(SNAP_PCT[best] - dragY) ? key : best,
      'peek'
    )
    setSnap(nearest)
    setDragY(null)
    dragStart.current = null
  }

  return (
    <div
      ref={sheetRef}
      className="absolute inset-x-0 bottom-0 z-20 lg:hidden rounded-t-2xl flex flex-col bg-bg-2"
      style={{
        height: '95%',
        transform: `translateY(${currentPct}%)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderTop: '1px solid var(--bdr)',
      }}
      role="dialog"
      aria-label={t('sheet.ariaLabel')}
    >
      {/* Drag handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-none h-sp-6 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        aria-label={t('sheet.handle')}
        role="separator"
        aria-orientation="horizontal"
      >
        <div
          className="w-8 h-1 rounded-full"
          style={{ background: 'var(--muted-2)' }}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <ItineraryPanelContent
        itinerary={itinerary}
        selectedPoiId={selectedPoiId}
        isLiked={isLiked}
        isSaved={isSaved}
        isOwner={isOwner}
        onStopSelect={onStopSelect}
        onLike={onLike}
        onSave={onSave}
        onShare={onShare}
        onEdit={onEdit}
        onDeleteClick={onDeleteClick}
      />
    </div>
  )
}
