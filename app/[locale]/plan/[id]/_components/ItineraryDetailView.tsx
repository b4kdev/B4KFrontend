'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { RefreshCw, Lock, Route, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useItinerary } from '@/hooks/useItinerary'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import NaverMapCanvas from '@/components/map/NaverMapCanvas'
import ItineraryPanelContent from './ItineraryPanelContent'
import ItineraryMobileSheet from './ItineraryMobileSheet'
import type { MapPoi } from '@/hooks/useMapPois'
import type { ItineraryDetail } from '@/app/api/plans/[id]/route'

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
  const [deleteOpen,    setDeleteOpen]      = useState(false)
  const [deleting,      setDeleting]        = useState(false)
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
    fetch('/api/likes/plan', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan_id: id }),
    })
      .then(() => mutate())
      .catch(() => {})
  }, [session, isLiked, openAuthGate, showToast, t, id, mutate])

  const handleSave = useCallback(() => {
    if (!session) { openAuthGate('save_plan_other'); return }
    const next = !isSaved
    setSavedOverride(next)
    showToast(next ? t('actions.savedToast') : t('actions.unsavedToast'))
    fetch('/api/saved/plan', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan_id: id }),
    })
      .then(() => mutate())
      .catch(() => {})
  }, [session, isSaved, openAuthGate, showToast, t, id, mutate])

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return
    // Shared URL always carries ?ref=share (S-BMGOFW)
    const url = new URL(itinerary?.share_url ?? window.location.href, window.location.origin)
    url.searchParams.set('ref', 'share')
    const shareUrl = url.toString()

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: itinerary?.title, url: shareUrl })
        return
      } catch (err) {
        // User cancelled the native sheet — do nothing
        if ((err as DOMException)?.name === 'AbortError') return
        // Otherwise fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    showToast(t('copiedToast'))
  }, [itinerary, showToast, t])

  const handleEdit = useCallback(() => {
    router.push(`/map?plan=${id}`)
  }, [router, id])

  // IT_01 Not Found → brief message, then redirect to /map (spec: 404 → /map)
  useEffect(() => {
    if (!isNotFound) return
    const timer = setTimeout(() => router.push('/map'), 1500)
    return () => clearTimeout(timer)
  }, [isNotFound, router])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete_failed')
      router.push('/map')
    } catch {
      showToast(t('actions.deleteErrorToast'))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }, [id, router, showToast, t])

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10 flex items-center justify-center bg-bg">
        <span className="w-8 h-8 border-2 border-lav border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-4 bg-bg px-sp-6 text-center"
        role="alert"
      >
        <p className="text-f-lg font-semibold text-fg">{t('error.title')}</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-sp-2 min-h-touch px-sp-5 rounded-none text-f-md font-semibold text-lav"
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
      <div className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-3 bg-bg text-center px-sp-6">
        <Lock size={32} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        <p className="text-f-lg font-semibold text-fg">{t('private')}</p>
        <p className="text-f-md text-muted max-w-[280px]">{t('privateDesc')}</p>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────
  if (isNotFound || !itinerary) {
    return (
      <div className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10 flex flex-col items-center justify-center gap-sp-3 bg-bg text-center px-sp-6">
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
    planId: id,
    onStopSelect:  handlePoiSelect,
    onLike:        handleLike,
    onSave:        handleSave,
    onShare:       handleShare,
    onEdit:        handleEdit,
    onDeleteClick: () => setDeleteOpen(true),
  }

  // ── Success ────────────────────────────────────────────────────
  return (
    <div className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10">

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

      {/* Delete confirm modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-sp-4"
          style={{ background: 'var(--backdrop-50)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-none p-sp-6 flex flex-col gap-sp-4"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div className="flex items-center gap-sp-3">
              <AlertTriangle size={20} strokeWidth={2} className="text-danger shrink-0" aria-hidden="true" />
              <p id="delete-modal-title" className="text-f-lg font-semibold text-fg">
                {t('actions.deleteTitle')}
              </p>
            </div>
            <p className="text-f-md text-muted">{t('actions.deleteConfirmText')}</p>
            <div className="flex gap-sp-3 justify-end">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="min-h-touch px-sp-4 text-f-md font-semibold text-muted hover:text-fg transition-colors"
              >
                {t('actions.deleteCancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label={t('actions.deleteAria')}
                className="min-h-touch px-sp-5 rounded-none text-f-md font-semibold text-fg flex items-center gap-sp-2 disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
              >
                {deleting
                  ? <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                  : <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                }
                {deleting ? t('actions.deleting') : t('actions.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
