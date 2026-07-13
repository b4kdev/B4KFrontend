'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Sparkles } from 'lucide-react'
import NaverMapCanvas from './NaverMapCanvas'
import LeftPanel from './LeftPanel/index'
import AIOverlay from './AIOverlay'
import POIBottomSheet from './POIBottomSheet'
import PlanPill from './PlanPill'
import PlanBottomSheet from './PlanBottomSheet'
import DraftConflictModal from '@/components/auth/DraftConflictModal'
import PlanNamingSheet from './PlanNamingSheet'
import DraftResumeFreshModal from './DraftResumeFreshModal'
import { useMapPois } from '@/hooks/useMapPois'
import { useSaved } from '@/hooks/useSaved'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import { getDraftPlan, saveDraftPlan, clearDraftPlan } from '@/lib/draft-plan'
import type { MapPoi } from '@/hooks/useMapPois'
import type { DraftMeta } from '@/components/auth/DraftConflictModal'
import type { ItineraryDetail } from '@/app/api/plans/[id]/route'

type PendingPlan = {
  deviceDraft:  DraftMeta
  accountDraft: DraftMeta
  ids:          string[]
  durations:    Record<string, number>
  pois:         MapPoi[]
}

const MAX_STOPS = 40
const DEFAULT_DURATION = 60

export default function MapView() {
  const t = useTranslations('map')
  const router = useRouter()
  const { data: session } = useSession()
  const { open: openAuthGate } = useAuthGate()
  const { showToast } = useToast()

  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [activeRegion, setActiveRegion]   = useState<string | null>(null)
  const [showAiPill, setShowAiPill]       = useState(false)
  const [aiOverlayOpen, setAiOverlayOpen] = useState(false)
  const [planStopIds, setPlanStopIds]     = useState<string[]>([])
  const [savedPoiIds, setSavedPoiIds]     = useState<Set<string>>(new Set())
  const [likedPoiIds, setLikedPoiIds]     = useState<Set<string>>(new Set())
  const [stopDurations, setStopDurations] = useState<Record<string, number>>({})
  const [planSheetOpen, setPlanSheetOpen] = useState(false)
  const [poiSheetSnap, setPoiSheetSnap]   = useState<'peek' | 'mid' | 'full'>('mid')
  const [loadedPlanPois, setLoadedPlanPois] = useState<MapPoi[]>([])
  const [draftConflict, setDraftConflict]   = useState<PendingPlan | null>(null)
  // DEC-29: naming sheet shown before publishing
  const [namingSheetOpen, setNamingSheetOpen]   = useState(false)
  // DEC-33 T1: "Resume or start fresh?" when adding first stop but DB draft exists
  const [draftResumeOpen, setDraftResumeOpen]   = useState(false)
  const [draftResumeStopCount, setDraftResumeStopCount] = useState(0)
  const [draftResumePlanId, setDraftResumePlanId]       = useState<string | null>(null)
  // Pending POI to add after T1 resolution
  const [pendingPoiId, setPendingPoiId] = useState<string | null>(null)
  // DEC-29: track saving state for PlanNamingSheet spinner
  const [namingSaving, setNamingSaving] = useState(false)
  const savedSeededRef  = useRef(false)
  // DEC-33 T1: track whether draft-conflict check has been resolved this session
  const t1CheckedRef    = useRef(false)

  const { pois } = useMapPois(activeRegion, activeFilters)
  const { data: savedData, mutate: mutateSaved } = useSaved()

  // Restore draft plan on mount — skip if a specific plan is being loaded via ?plan param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('plan')) return
    const draft = getDraftPlan()
    if (!draft || draft.stops.length === 0) return
    const ids = draft.stops.map(s => s.place_id)
    setPlanStopIds(ids)
    setStopDurations(draft.durations)
    clearDraftPlan()
  }, [])

  // Seed savedPoiIds from API on first load — one-time only so local toggles aren't overwritten
  useEffect(() => {
    if (savedSeededRef.current || !savedData?.pois) return
    savedSeededRef.current = true
    setSavedPoiIds(new Set(savedData.pois.map(p => p.place_id)))
  }, [savedData])

  // URL param handling — ?plan=:id loads plan into edit mode; ?ai=1 opens AI overlay
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('ai') === '1') setAiOverlayOpen(true)

    const poiId = params.get('poi')
    if (poiId) setSelectedPoiId(poiId)

    const planId = params.get('plan')
    if (!planId || planId === 'new') return

    fetch(`/api/plans/${planId}`)
      .then(r => r.ok ? r.json() as Promise<ItineraryDetail> : Promise.reject())
      .then(itinerary => {
        const sorted = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
        const ids:  string[]               = sorted.map(s => s.poi.place_id)
        const durs: Record<string, number> = {}
        const lpois: MapPoi[]              = []

        sorted.forEach(s => {
          durs[s.poi.place_id] = s.duration_min
          lpois.push({
            place_id:      s.poi.place_id,
            name_ko:       s.poi.name_ko,
            name_en:       s.poi.name_en,
            coords_lat:    s.poi.coords_lat,
            coords_lng:    s.poi.coords_lng,
            display_domain: s.poi.display_domain,
            display_region: '',
            is_trending:   false,
            is_partner:    false,
            quality_score: 0,
          })
        })

        const localDraft = getDraftPlan()
        if (localDraft && localDraft.stops.length > 0) {
          setDraftConflict({
            deviceDraft:  { stopCount: localDraft.stops.length, lastModified: new Date().toISOString() },
            accountDraft: { stopCount: ids.length,              lastModified: new Date().toISOString() },
            ids, durations: durs, pois: lpois,
          })
        } else {
          setPlanStopIds(ids)
          setStopDurations(durs)
          setLoadedPlanPois(lpois)
        }
      })
      .catch(() => {})
  }, [])

  // Ordered stop POIs for LeftPanel and polyline — fallback to loadedPlanPois for plan-edit mode
  const planStops = planStopIds
    .map(id => pois.find(p => p.place_id === id) ?? loadedPlanPois.find(p => p.place_id === id))
    .filter((p): p is MapPoi => !!p)

  const selectedPoi = selectedPoiId
    ? pois.find(p => p.place_id === selectedPoiId) ?? null
    : null

  function handleRegionToggle(region: string) {
    setActiveRegion(prev => prev === region ? null : region)
    setSelectedPoiId(null)
  }

  function handleFilterToggle(filter: string) {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  function handleAddToPlan(poiId: string) {
    if (planStopIds.includes(poiId) || planStopIds.length >= MAX_STOPS) return

    // DEC-33 T1: logged-in user, first plan interaction this session → check for existing DB draft
    if (session && !t1CheckedRef.current) {
      fetch('/api/plans/draft')
        .then(r => r.ok ? r.json() : null)
        .then((dbDraft: { id: string; stop_count: number } | null) => {
          if (dbDraft?.id) {
            setPendingPoiId(poiId)
            setDraftResumeStopCount(dbDraft.stop_count ?? 0)
            setDraftResumePlanId(dbDraft.id)
            setDraftResumeOpen(true)
          } else {
            // No DB draft — add directly, mark T1 as done for this session
            t1CheckedRef.current = true
            setPlanStopIds(prev => [...prev, poiId])
            setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
            showToast(t('poiDetail.addedToast'))
          }
        })
        .catch(() => {
          // Network error — proceed without T1 check, mark as done to avoid repeated prompts
          t1CheckedRef.current = true
          setPlanStopIds(prev => [...prev, poiId])
          setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
          showToast(t('poiDetail.addedToast'))
        })
      return
    }

    setPlanStopIds(prev => [...prev, poiId])
    setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
    showToast(t('poiDetail.addedToast'))
  }

  // DEC-33 T1: resume existing DB draft — load it into editing state
  async function handleResumeExistingDraft() {
    setDraftResumeOpen(false)
    t1CheckedRef.current = true
    setPendingPoiId(null)
    if (!draftResumePlanId) return
    try {
      const res = await fetch(`/api/plans/${draftResumePlanId}`)
      if (!res.ok) return
      const itinerary = await res.json() as { stops: Array<{ stop_order: number; poi: { place_id: string; name_ko: string; name_en: string; coords_lat: number; coords_lng: number; display_domain: string }; duration_min: number }> }
      const sorted = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
      const ids:  string[]               = sorted.map(s => s.poi.place_id)
      const durs: Record<string, number> = {}
      const lpois: MapPoi[]              = []
      sorted.forEach(s => {
        durs[s.poi.place_id] = s.duration_min
        lpois.push({
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
        })
      })
      setPlanStopIds(ids)
      setStopDurations(durs)
      setLoadedPlanPois(lpois)
    } catch {
      // Silent failure — user continues with blank plan
    }
  }

  // DEC-33 T1: start fresh — delete DB draft, then add the pending POI
  async function handleStartFresh() {
    setDraftResumeOpen(false)
    t1CheckedRef.current = true
    if (draftResumePlanId) {
      try {
        await fetch(`/api/plans/${draftResumePlanId}`, { method: 'DELETE' })
      } catch {
        // Silent — worst case: stale draft remains
      }
    }
    setDraftResumePlanId(null)
    const poiToAdd = pendingPoiId
    setPendingPoiId(null)
    if (poiToAdd) {
      setPlanStopIds([poiToAdd])
      setStopDurations({ [poiToAdd]: DEFAULT_DURATION })
      showToast(t('poiDetail.addedToast'))
    }
  }

  function handleRemoveFromPlan(poiId: string) {
    setPlanStopIds(prev => prev.filter(id => id !== poiId))
    setStopDurations(prev => { const next = { ...prev }; delete next[poiId]; return next })
  }

  function handleToggleSave(poi: MapPoi) {
    if (!session) { openAuthGate('save_poi'); return }
    const removing = savedPoiIds.has(poi.place_id)
    setSavedPoiIds(prev => {
      const next = new Set(prev)
      if (removing) {
        next.delete(poi.place_id)
        showToast(t('poiDetail.removedSave'), 'info')
      } else {
        next.add(poi.place_id)
        showToast(t('poiDetail.savedToast'))
      }
      return next
    })
    fetch('/api/saved/poi', {
      method:  removing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: poi.place_id }),
    })
      .then(() => mutateSaved())
      .catch(() => {})
  }

  function handleToggleLike(poi: MapPoi) {
    if (!session) { openAuthGate('like'); return }
    const removing = likedPoiIds.has(poi.place_id)
    setLikedPoiIds(prev => {
      const next = new Set(prev)
      if (removing) next.delete(poi.place_id)
      else next.add(poi.place_id)
      return next
    })
    fetch('/api/likes/poi', {
      method:  removing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: poi.place_id }),
    }).catch(() => {
      // revert on failure
      setLikedPoiIds(prev => {
        const next = new Set(prev)
        if (removing) next.add(poi.place_id)
        else next.delete(poi.place_id)
        return next
      })
    })
  }

  function handleReorder(newOrder: string[]) {
    setPlanStopIds(newOrder)
  }

  function handleDurationChange(id: string, minutes: number) {
    setStopDurations(prev => ({ ...prev, [id]: minutes }))
  }

  // DEC-29: open naming sheet instead of auto-saving
  function handlePreviewPlan() {
    if (!session) { openAuthGate('save_plan'); return }
    setNamingSheetOpen(true)
  }

  // DEC-29: user confirmed title → POST draft then PATCH is_published=true → navigate IT_01
  async function handleConfirmNaming(title: string) {
    setNamingSaving(true)
    saveDraftPlan({ stops: planStops, durations: stopDurations })
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          stops: planStops.map((s, i) => ({
            poi_id:       s.place_id,
            stop_order:   i + 1,
            duration_min: stopDurations[s.place_id] ?? DEFAULT_DURATION,
          })),
          is_published: false,
        }),
      })
      if (!res.ok) throw new Error()
      const { plan } = await res.json() as { plan: { id: string } }
      // PATCH is_published = true (naming sheet confirm = publish intent per DEC-29)
      const patchRes = await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: true }),
      })
      if (!patchRes.ok) throw new Error()
      clearDraftPlan()
      setNamingSheetOpen(false)
      setNamingSaving(false)
      router.push(`/plan/${plan.id}`)
    } catch {
      setNamingSaving(false)
      showToast(t('plan.saveError'), 'error')
    }
  }

  function handlePlanPillTap() {
    setSelectedPoiId(null)
    setPlanSheetOpen(true)
  }

  function handleConflictKeepDevice() {
    setDraftConflict(null)
  }

  function handleConflictKeepAccount() {
    if (!draftConflict) return
    clearDraftPlan()
    setPlanStopIds(draftConflict.ids)
    setStopDurations(draftConflict.durations)
    setLoadedPlanPois(draftConflict.pois)
    setDraftConflict(null)
  }

  return (
    <div className="fixed top-[50px] left-0 right-0 bottom-14 lg:left-[50px] lg:bottom-0 z-10">

      {/* LeftPanel — desktop only */}
      <aside
        className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 w-[224px] bg-bg-2"
        style={{ borderRight: '1px solid var(--bdr)' }}
        aria-label={t('leftPanel.ariaLabel')}
      >
        <LeftPanel
          pois={pois}
          selectedPoiId={selectedPoiId}
          activeRegion={activeRegion}
          activeFilters={activeFilters}
          planStops={planStops}
          stopDurations={stopDurations}
          onRegionToggle={handleRegionToggle}
          onFilterToggle={handleFilterToggle}
          isSaved={id => savedPoiIds.has(id)}
          isInPlan={id => planStopIds.includes(id)}
          planFull={planStopIds.length >= MAX_STOPS}
          onAddToPlan={handleAddToPlan}
          onToggleSave={handleToggleSave}
          onReorder={handleReorder}
          onRemove={handleRemoveFromPlan}
          onDurationChange={handleDurationChange}
          onPreviewPlan={handlePreviewPlan}
        />
      </aside>

      {/* Map canvas */}
      <div className="absolute inset-0 lg:left-[224px]">
        <NaverMapCanvas
          pois={pois}
          selectedPoiId={selectedPoiId}
          planStopIds={planStopIds}
          onPoiSelect={setSelectedPoiId}
          showAiPill={showAiPill}
          onAiPillDismiss={() => setShowAiPill(false)}
          onAiPillExpand={() => setAiOverlayOpen(true)}
          aiOverlayOpen={aiOverlayOpen}
          onAiOpen={() => setAiOverlayOpen(true)}
        />

        {/* Plan Pill — mobile, when stops > 0; hidden while the POI sheet covers it (mid/full) */}
        {!(selectedPoiId && !aiOverlayOpen && !planSheetOpen && poiSheetSnap !== 'peek') && (
          <PlanPill
            stopCount={planStopIds.length}
            onTap={handlePlanPillTap}
          />
        )}

        {/* Mobile AI FAB — AI_01 */}
        {!aiOverlayOpen && (
          <button
            onClick={() => setAiOverlayOpen(true)}
            aria-label={t('aiOverlay.openButton')}
            className="lg:hidden absolute bottom-sp-4 right-sp-4 z-20 w-touch h-touch rounded-full bg-lav text-bg flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
          >
            <Sparkles size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}

        {/* AI Overlay — MP_30–35, FL3_01–08 */}
        <AIOverlay
          open={aiOverlayOpen}
          pois={pois}
          planStopIds={planStopIds}
          onAddToPlan={handleAddToPlan}
          onMinimize={() => { setAiOverlayOpen(false); setShowAiPill(true) }}
          onClose={() => setAiOverlayOpen(false)}
        />
      </div>

      {/* Mobile POI bottom sheet — BS_01–08 */}
      {selectedPoi && (
        <POIBottomSheet
          poi={selectedPoi}
          isOpen={!!selectedPoiId && !aiOverlayOpen && !planSheetOpen}
          isSaved={savedPoiIds.has(selectedPoi.place_id)}
          isLiked={likedPoiIds.has(selectedPoi.place_id)}
          isInPlan={planStopIds.includes(selectedPoi.place_id)}
          planFull={planStopIds.length >= MAX_STOPS}
          onAddToPlan={() => handleAddToPlan(selectedPoi.place_id)}
          onToggleSave={() => handleToggleSave(selectedPoi)}
          onToggleLike={() => handleToggleLike(selectedPoi)}
          onDismiss={() => setSelectedPoiId(null)}
          onSnapChange={setPoiSheetSnap}
        />
      )}

      {/* Mobile plan sheet — FL1 */}
      <PlanBottomSheet
        isOpen={planSheetOpen}
        stops={planStops}
        stopDurations={stopDurations}
        onReorder={handleReorder}
        onRemove={handleRemoveFromPlan}
        onDurationChange={handleDurationChange}
        onSavePlan={handlePreviewPlan}
        onDismiss={() => setPlanSheetOpen(false)}
      />

      {/* T2 collision modal — local draft vs plan loaded via ?plan=:id */}
      {draftConflict && (
        <DraftConflictModal
          open={true}
          deviceDraft={draftConflict.deviceDraft}
          accountDraft={draftConflict.accountDraft}
          onKeepDevice={handleConflictKeepDevice}
          onKeepAccount={handleConflictKeepAccount}
        />
      )}

      {/* DEC-29 — naming sheet before publishing */}
      <PlanNamingSheet
        open={namingSheetOpen}
        saving={namingSaving}
        initialTitle=""
        onSave={handleConfirmNaming}
        onCancel={() => setNamingSheetOpen(false)}
      />

      {/* DEC-33 T1 — Resume or start fresh when DB draft exists */}
      <DraftResumeFreshModal
        open={draftResumeOpen}
        stopCount={draftResumeStopCount}
        onResume={handleResumeExistingDraft}
        onStartFresh={handleStartFresh}
      />
    </div>
  )
}
