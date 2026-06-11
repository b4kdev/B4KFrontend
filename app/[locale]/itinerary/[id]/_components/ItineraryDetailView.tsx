'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { RefreshCw, Lock, Route } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useItinerary } from '@/hooks/useItinerary'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import NaverMapCanvas from '@/components/map/NaverMapCanvas'
import ItineraryPanelContent from './ItineraryPanelContent'
import ItineraryMobileSheet from './ItineraryMobileSheet'
import type { MapPoi } from '@/hooks/useMapPois'
import type { ItineraryDetail } from '@/app/api/itinerary/[id]/route'

function stopsToMapPois(detail: ItineraryDetail): MapPoi[] {
  return detail.stops.map(s => ({
    place_id:       s.poi.place_id,
    name_ko:        s.poi.name_ko,
    name_en:        s.poi.name_en,
    coords_lat:     s.poi.coords_lat,
    coords_lng:     s.poi.coords_lng,
    display_domain: s.poi.display_domain,
    display_region: '',
    is_trending:    false,
    is_partner:     false,
    quality_score:  0,
  }))
}

export default function ItineraryDetailView({ id }: { id: string }) {
  const t = useTranslations('itinerary')
  const { data: session } = useSession()
  const { open: openAuthGate } = useAuthGate()
  const { showToast } = useToast()
  const router = useRouter()
  const { itinerary, isLoading, isError, isPrivate, isNotFound, mutate } = useItinerary(id)

  const [selectedPoiId, setSelectedPoiId]   = useState<string | null>(null)
  const [likedOverride, setLikedOverride]   = useState<boolean | null>(null)
  const [savedOverride, setSavedOverride]   = useState<boolean | null>(null)
  const panelScrollRef = useRef<HTMLDivElement>(null)

  const isLiked = likedOverride ?? itinerary?.viewer.is_liked ?? false
  const isSaved = savedOverride ?? itinerary?.viewer.is_saved ?? false
  const isOwner = itinerary?.viewer.is_owner ?? false

  const stopPois    = itinerary ? stopsToMapPois(itinerary) : []
  const planStopIds = itinerary ? itinerary.stops.map(s => s.poi.place_id) : []

  const handlePoiSelect = useCallback((poiId: string | null) => {
    setSelectedPoiId(poiId)
    if (poiId && panelScrollRef.current) {
      const el = panelScrollRef.current.querySelector<HTMLElement>(`[data-poi="${poiId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  const handleLike = useCallback(() => {
    if (!session) { openAuthGate('like'); return }
    const next = !isLiked
    setLikedOverride(next)
    showToast(next ? t('actions.likedToast') : t('actions.unlikedToast'))
  }, [session, isLiked, openAuthGate, showToast, t])

  const handleSave = useCallback(() => {
    if (!session) { openAuthGate('save'); return }
    const next = !isSaved
    setSavedOverride(next)
    showToast(next ? t('actions.savedToast') : t('actions.unsavedToast'))
  }, [session, isSaved, openAuthGate, showToast, t])

  const handleShare = useCallback(async () => {
    const url = itinerary?.share_url ?? (typeof window !== 'undefined' ? window.location.href : '')
    await navigator.clipboard.writeText(url).catch(() => {})
    showToast(t('copiedToast'))
  }, [itinerary, showToast, t])

  const handleEdit = useCallback(() => {
    router.push(`/map?plan=${id}`)
  }, [router, id])

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10 flex items-center justify-center bg-bg">
        <span className="w-8 h-8 border-2 border-lav border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-4 bg-bg px-sp-6 text-center"
        role="alert"
      >
        <p className="text-f-lg font-semibold text-fg">{t('error.title')}</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-sp-2 min-h-touch px-sp-5 rounded-lg text-f-md font-semibold text-lav"
          style={{ border: '1px solid var(--lav-border)' }}
        >
          <RefreshCw size={14} strokeWidth={2} />
          {t('error.cta')}
        </button>
      </div>
    )
  }

  // ── Private ────────────────────────────────────────────────────
  if (isPrivate) {
    return (
      <div className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-3 bg-bg text-center px-sp-6">
        <Lock size={32} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        <p className="text-f-lg font-semibold text-fg">{t('private')}</p>
        <p className="text-f-md text-muted max-w-[280px]">{t('privateDesc')}</p>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────
  if (isNotFound || !itinerary) {
    return (
      <div className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-3 bg-bg text-center px-sp-6">
        <Route size={32} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        <p className="text-f-lg font-semibold text-fg">{t('notFound')}</p>
      </div>
    )
  }

  const panelProps = {
    itinerary,
    selectedPoiId,
    isLiked,
    isSaved,
    isOwner,
    onStopSelect: handlePoiSelect,
    onLike:       handleLike,
    onSave:       handleSave,
    onShare:      handleShare,
    onEdit:       handleEdit,
  }

  // ── Success ────────────────────────────────────────────────────
  return (
    <div className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10">

      {/* Desktop LeftPanel (LP_16B) */}
      <aside
        className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 w-[224px] bg-bg-2"
        style={{ borderRight: '1px solid var(--bdr)' }}
        aria-label={t('panel.ariaLabel')}
      >
        <ItineraryPanelContent
          {...panelProps}
          scrollRef={panelScrollRef}
        />
      </aside>

      {/* Map canvas */}
      <div className="absolute inset-0 lg:left-[224px]">
        <NaverMapCanvas
          pois={stopPois}
          selectedPoiId={selectedPoiId}
          planStopIds={planStopIds}
          onPoiSelect={handlePoiSelect}
          showAiPill={false}
          onAiPillDismiss={() => {}}
          onAiPillExpand={() => {}}
          aiOverlayOpen={false}
          onAiOpen={() => {}}
        />
      </div>

      {/* Mobile bottom sheet */}
      <ItineraryMobileSheet {...panelProps} />
    </div>
  )
}
