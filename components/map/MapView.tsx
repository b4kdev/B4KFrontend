'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle } from 'lucide-react'
import { track } from '@/lib/analytics'
import NaverMapCanvas from './NaverMapCanvas'
import LeftPanel from './LeftPanel/index'
import POIBottomSheet from './POIBottomSheet'
import PlanPill from './PlanPill'
import PlanBottomSheet from './PlanBottomSheet'
import SavedBottomSheet from './SavedBottomSheet'
import DraftConflictModal from '@/components/auth/DraftConflictModal'
import PlanNamingSheet from './PlanNamingSheet'
import DraftResumeFreshModal from './DraftResumeFreshModal'
import { useMapPois } from '@/hooks/useMapPois'
import { usePlaceDetail } from '@/hooks/usePlaceDetail'
import { useSaved } from '@/hooks/useSaved'
import { useSavedPois } from '@/hooks/useSavedPois'
import { useLikedPois } from '@/hooks/useLikedPois'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import { getDraftPlan, saveDraftPlan, clearDraftPlan } from '@/lib/draft-plan'
import { MAX_STOPS } from '@/lib/plan-constants'
import type { MapPoi, MapBounds } from '@/hooks/useMapPois'
import type { DraftMeta } from '@/components/auth/DraftConflictModal'
import type { ItineraryDetail } from '@/lib/itinerary'
import type { SavedPoi } from '@/app/api/saved/route'

type PendingPlan = {
  deviceDraft:  DraftMeta
  accountDraft: DraftMeta
  ids:          string[]
  durations:    Record<string, number>
  pois:         MapPoi[]
}

const DEFAULT_DURATION = 60

export default function MapView() {
  const t = useTranslations('map')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const { showToast } = useToast()

  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [activeRegion, setActiveRegion]   = useState<string | null>(null)
  const [showAiPill, setShowAiPill]       = useState(false)
  const [aiOverlayOpen, setAiOverlayOpen] = useState(false)
  const [planStopIds, setPlanStopIds]     = useState<string[]>([])
  const [stopDurations, setStopDurations] = useState<Record<string, number>>({})
  const [planSheetOpen, setPlanSheetOpen] = useState(false)
  const [poiSheetSnap, setPoiSheetSnap]   = useState<'peek' | 'mid' | 'full'>('mid')
  const [savedSheetOpen, setSavedSheetOpen] = useState(false)
  // SC-31/DEC-38 (S-HDTVGP/S-IGOSPS) — active exclusive "show only these POIs"
  // set, synced to the map: a Saved-hub folder, a bookmark "view on map"
  // action, etc. Full POI objects (not ids) so a member outside the
  // currently-loaded viewport `pois` still renders — see NaverMapCanvas's
  // restrictToPois prop.
  const [restrictToPois, setRestrictToPois] = useState<SavedPoi[] | null>(null)
  // Viewport-bounds fetching — null until NaverMapCanvas's first 'idle' fires,
  // so useMapPois falls back to its no-bounds (nationwide top-N) query until then.
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [mapZoom, setMapZoom] = useState(12)
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
  // UF-6 (G5.6) — discard-draft confirm dialog
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  // UF-5 (G4.2) — day assignment (1–7) per stop; new stops join the active day tab
  const [stopDays, setStopDays]   = useState<Record<string, number>>({})
  const [activeDay, setActiveDay] = useState(1)
  // SC-25 — sticky once 'ai': PlanPill reads this to show "AI Plan · X stops"
  // once any stop came from FL3, even if the user adds more stops manually after.
  const [planSource, setPlanSource] = useState<'manual' | 'ai'>('manual')
  // DEC-33 T1: track whether draft-conflict check has been resolved this session
  const t1CheckedRef    = useRef(false)

  const handleBoundsChange = useCallback((bounds: MapBounds, zoom: number) => {
    setMapBounds(bounds)
    setMapZoom(zoom)
  }, [])

  const { pois, isLoading: poisLoading, isError: poisError } =
    useMapPois(activeRegion, activeFilters, mapBounds, mapZoom)
  const { data: savedData } = useSaved()
  // Save/like state + toggles — shared with /place/:id via these hooks so the
  // two surfaces can't diverge (see hooks/useSavedPois, hooks/useLikedPois).
  const { savedPoiIds, isSaved, toggleSave } = useSavedPois()
  const { likedPoiIds, toggleLike } = useLikedPois()

  useEffect(() => {
    if (!selectedPoiId) return
    const poi = pois.find(p => p.poi_id === selectedPoiId)
    if (poi) track('poi_view', { poi_id: poi.poi_id, domain: poi.display_domain ?? 'unknown', region: poi.display_region ?? undefined, locale, screen_id: 'MP_01' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId])

  // Restore draft plan on mount — skip if a specific plan is being loaded via
  // ?plan param, and skip for logged-in users (their draft lives in the DB —
  // see the DB-draft-restore effect below; localStorage is guest-only and
  // should already be empty post-login via useDraftMigration).
  useEffect(() => {
    if (session) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('plan')) return
    const draft = getDraftPlan()
    if (!draft || draft.stops.length === 0) return
    const ids = draft.stops.map(s => s.poi_id)
    setPlanStopIds(ids)
    setStopDurations(draft.durations)
    clearDraftPlan()
  }, [session])

  // Restore an in-progress DB draft on mount for logged-in users — the
  // autosave effect below persists every change to /api/plans/draft, but
  // nothing previously read it back on remount, so navigating away from
  // /map and back (or a fresh tab) showed a blank plan even though the DB
  // draft still existed. Mirrors handleResumeExistingDraft's fetch-by-id
  // shape. Marks T1 as checked so handleAddToPlan doesn't re-prompt
  // "resume or start fresh?" for the draft this effect just restored.
  const dbDraftRestoredRef = useRef(false)
  useEffect(() => {
    if (!session || dbDraftRestoredRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('plan')) return
    if (planStopIds.length > 0) return
    dbDraftRestoredRef.current = true

    fetch('/api/plans/draft')
      .then(r => r.ok ? r.json() as Promise<{ id: string } | null> : null)
      .then(dbDraft => {
        if (!dbDraft?.id) return null
        return fetch(`/api/plans/${dbDraft.id}`)
          .then(r => r.ok ? r.json() as Promise<ItineraryDetail> : null)
      })
      .then(itinerary => {
        if (!itinerary) return
        t1CheckedRef.current = true
        const sorted = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
        const ids:  string[]               = sorted.map(s => s.poi.poi_id)
        const durs: Record<string, number> = {}
        const lpois: MapPoi[]              = []
        sorted.forEach(s => {
          durs[s.poi.poi_id] = s.duration_min
          lpois.push({
            poi_id:      s.poi.poi_id,
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
        setPlanStopIds(ids)
        setStopDurations(durs)
        setLoadedPlanPois(lpois)
      })
      .catch(() => { /* blank plan — user can keep building, autosave retries */ })
  }, [session, planStopIds.length])

  // H13 — Saved sheet reacts to ?saved=1 (toggled from the mobile Saved tab
  // on the same page, so this must track searchParams, not just mount).
  useEffect(() => {
    setSavedSheetOpen(searchParams.get('saved') === '1')
  }, [searchParams])

  // Item 7 — "view on map" from /saved's folder-detail view: ?view=saved
  // (+ optional &folder=:id) resolves to an exclusive restrictToPois set +
  // fitBounds, same convention as the existing Saved-hub folder-open feature.
  // Tracks searchParams (not mount-only) since savedData may resolve after
  // this first fires; consumed-once via the ref so a later unrelated
  // searchParams/savedData change doesn't re-trigger it.
  const restrictConsumedRef = useRef(false)
  useEffect(() => {
    if (searchParams.get('view') !== 'saved' || restrictConsumedRef.current || !savedData) return
    restrictConsumedRef.current = true
    const folderId = searchParams.get('folder')
    const folderPois = folderId ? savedData.folders.find(f => f.id === folderId)?.pois : undefined
    setRestrictToPois(folderPois ?? savedData.pois)
    router.replace('/map')
  }, [searchParams, savedData, router])

  // URL param handling — ?plan=:id loads plan into edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const poiId = params.get('poi')
    if (poiId) setSelectedPoiId(poiId)

    const planId = params.get('plan')
    if (!planId || planId === 'new') return

    fetch(`/api/plans/${planId}`)
      .then(r => r.ok ? r.json() as Promise<ItineraryDetail> : Promise.reject())
      .then(itinerary => {
        const sorted = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
        const ids:  string[]               = sorted.map(s => s.poi.poi_id)
        const durs: Record<string, number> = {}
        const lpois: MapPoi[]              = []

        sorted.forEach(s => {
          durs[s.poi.poi_id] = s.duration_min
          lpois.push({
            poi_id:      s.poi.poi_id,
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

  // /place/:id "Add to Plan" bridges here via ?poi=:id&addToPlan=1 — keeps plan-
  // building centralized in this one builder rather than growing a second
  // add-to-plan path. Waits until auth has resolved (so a logged-in user hits
  // handleAddToPlan's DB-draft T1 check, not the guest path) and pois have
  // loaded (so the added stop can render), runs it once, then strips addToPlan
  // from the URL — leaving ?poi= so the POI stays selected/focused.
  const addToPlanConsumedRef = useRef(false)
  useEffect(() => {
    if (addToPlanConsumedRef.current || authLoading || poisLoading) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('addToPlan') !== '1') return
    const poiId = params.get('poi')
    if (!poiId) return
    addToPlanConsumedRef.current = true
    handleAddToPlan(poiId)
    router.replace(`/map?poi=${poiId}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, poisLoading])

  // Ordered stop POIs for LeftPanel and polyline — fallback to loadedPlanPois for plan-edit mode
  const planStops = planStopIds
    .map(id => pois.find(p => p.poi_id === id) ?? loadedPlanPois.find(p => p.poi_id === id))
    .filter((p): p is MapPoi => !!p)

  // UF-1 (G5.2 / G5.3) — continuous autosave on every stop/reorder/duration
  // change, not just at final "Save Plan". Guest → localStorage. Logged-in →
  // DB draft (is_published=false) via the same endpoint useDraftMigration
  // checks against. Skipped while editing an existing published plan
  // (?plan=:id) — that flow has its own save/publish path, and while a
  // draft-conflict prompt is unresolved (don't autosave over a pending pick).
  useEffect(() => {
    if (searchParams.get('plan')) return
    if (draftConflict || draftResumeOpen) return
    if (planStopIds.length === 0) return

    const timer = setTimeout(() => {
      const draft = { stops: planStops, durations: stopDurations }
      if (session) {
        fetch('/api/plans/draft', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(draft),
        }).catch(() => { /* retried on next change; localStorage is not the fallback for logged-in users */ })
      } else {
        saveDraftPlan(draft)
      }
    }, 800)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planStopIds, stopDurations, session])

  // List data shows immediately (already loaded); detail (address/description/
  // website_url) fills in once GET /places/:id resolves — see hooks/usePlaceDetail.ts.
  // Falls back to detail alone when the selected POI isn't in the currently-loaded
  // list (e.g. navigated in from Home/Explore, outside the default/filtered set) —
  // usePlaceDetail's shape is a complete MapPoi, so this still has coords for the
  // pin and everything LeftPanel/POIBottomSheet need.
  const listPoi = selectedPoiId
    ? pois.find(p => p.poi_id === selectedPoiId) ?? null
    : null
  const { detail: selectedPoiDetail } = usePlaceDetail(selectedPoiId)
  const selectedPoi = listPoi
    ? { ...listPoi, ...selectedPoiDetail }
    : selectedPoiDetail

  function handleRegionToggle(region: string) {
    setActiveRegion(prev => prev === region ? null : region)
    setSelectedPoiId(null)
  }

  function handleFilterToggle(filter: string) {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  function handleAddToPlan(poiId: string, source: 'manual' | 'ai' = 'manual') {
    if (planStopIds.includes(poiId)) return
    // UF-7 (DEC-27 / G4.2) — enforce the 40-stop cap with visible feedback, not a silent no-op.
    if (planStopIds.length >= MAX_STOPS) {
      showToast(t('plan.maxStopsToast', { max: MAX_STOPS }), 'error')
      return
    }
    const isFirstStop = planStopIds.length === 0
    if (isFirstStop) track('plan_create', { method: source, locale, screen_id: 'MP_01' })
    if (source === 'ai') setPlanSource('ai')

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
            setStopDays(prev => ({ ...prev, [poiId]: activeDay }))
            showToast(t('poiDetail.addedToast'))
          }
        })
        .catch(() => {
          // Network error — proceed without T1 check, mark as done to avoid repeated prompts
          t1CheckedRef.current = true
          setPlanStopIds(prev => [...prev, poiId])
          setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
          setStopDays(prev => ({ ...prev, [poiId]: activeDay }))
          showToast(t('poiDetail.addedToast'))
        })
      return
    }

    setPlanStopIds(prev => [...prev, poiId])
    setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
    setStopDays(prev => ({ ...prev, [poiId]: activeDay }))
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
      const itinerary = await res.json() as { stops: Array<{ stop_order: number; poi: { poi_id: string; name_ko: string; name_en: string; coords_lat: number; coords_lng: number; display_domain: string }; duration_min: number }> }
      const sorted = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
      const ids:  string[]               = sorted.map(s => s.poi.poi_id)
      const durs: Record<string, number> = {}
      const lpois: MapPoi[]              = []
      sorted.forEach(s => {
        durs[s.poi.poi_id] = s.duration_min
        lpois.push({
          poi_id:       s.poi.poi_id,
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
      setStopDays({ [poiToAdd]: activeDay })
      showToast(t('poiDetail.addedToast'))
    }
  }

  function handleRemoveFromPlan(poiId: string) {
    setPlanStopIds(prev => prev.filter(id => id !== poiId))
    setStopDurations(prev => { const next = { ...prev }; delete next[poiId]; return next })
    setStopDays(prev => { const next = { ...prev }; delete next[poiId]; return next })
  }

  // Receives the reordered ids for whichever day is currently visible (the
  // child panel is day-filtered) and splices them back into their original
  // slots in the full ordered list, leaving other days' stops untouched.
  function handleReorder(newDayOrder: string[]) {
    setPlanStopIds(prev => {
      const daySet = new Set(newDayOrder)
      let i = 0
      return prev.map(id => (daySet.has(id) ? newDayOrder[i++] : id))
    })
  }

  function handleDurationChange(id: string, minutes: number) {
    setStopDurations(prev => ({ ...prev, [id]: minutes }))
  }

  // DEC-29: open naming sheet instead of auto-saving
  function handlePreviewPlan() {
    if (!session) { openAuthGate('save_plan'); return }
    setNamingSheetOpen(true)
  }

  // UF-6 (G5.6) — discard the active draft: hard-delete the DB draft, clear
  // localStorage, reset builder state, and reset the map to its default (no
  // ?plan param).
  // BLK-08 (related finding): don't rely on draftResumePlanId — it's only
  // populated when the T1 "Resume or start fresh?" modal fired this session.
  // The autosave effect upserts a DB draft on every change regardless of T1,
  // so re-fetch the current draft id fresh at discard-time instead of trusting
  // stale/absent local state, or a draft created without ever hitting T1 never
  // gets deleted.
  async function handleConfirmDiscard() {
    setDiscardConfirmOpen(false)
    clearDraftPlan()
    setPlanStopIds([])
    setStopDurations({})
    setLoadedPlanPois([])
    setPlanSource('manual')
    if (session) {
      try {
        const res = await fetch('/api/plans/draft')
        const draft = res.ok ? await res.json() as { id: string } | null : null
        if (draft?.id) {
          await fetch(`/api/plans/${draft.id}`, { method: 'DELETE' })
        }
      } catch {
        // Silent — worst case: stale draft remains, same as before this fix
      }
    }
    router.push('/map')
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
            poi_id:       s.poi_id,
            stop_order:   i + 1,
            duration_min: stopDurations[s.poi_id] ?? DEFAULT_DURATION,
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
      track('plan_save', { plan_id: plan.id, stop_count: planStops.length, method: planSource, locale, screen_id: 'MP_01' })
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
    <div className="fixed top-[50px] lg:top-[56px] left-0 right-0 bottom-14 lg:left-[56px] lg:bottom-0 z-10">

      {/* LeftPanel — desktop only */}
      <aside
        className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 w-sidebar bg-bg-2"
        aria-label={t('leftPanel.ariaLabel')}
      >
        <LeftPanel
          pois={pois}
          selectedPoi={selectedPoi}
          activeRegion={activeRegion}
          activeFilters={activeFilters}
          planStops={planStops}
          stopDurations={stopDurations}
          onRegionToggle={handleRegionToggle}
          onFilterToggle={handleFilterToggle}
          isSaved={isSaved}
          isInPlan={id => planStopIds.includes(id)}
          planFull={planStopIds.length >= MAX_STOPS}
          onAddToPlan={handleAddToPlan}
          onToggleSave={toggleSave}
          isLiked={selectedPoi ? likedPoiIds.has(selectedPoi.poi_id) : false}
          onToggleLike={() => selectedPoi && toggleLike(selectedPoi)}
          onReorder={handleReorder}
          onRemove={handleRemoveFromPlan}
          onDurationChange={handleDurationChange}
          onPreviewPlan={handlePreviewPlan}
          onDiscardPlan={() => setDiscardConfirmOpen(true)}
          stopDays={stopDays}
          activeDay={activeDay}
          onDayChange={setActiveDay}
          onClosePoi={() => setSelectedPoiId(null)}
          onSelectPoi={setSelectedPoiId}
          poisLoading={poisLoading}
          poisError={poisError}
          savedHubOpen={savedSheetOpen}
          onOpenSaved={() => router.replace('/map?saved=1')}
          onCloseSavedHub={() => { setSavedSheetOpen(false); router.replace('/map') }}
          onSavedFolderChange={setRestrictToPois}
        />
      </aside>

      {/* Map canvas */}
      <div className="absolute inset-0 lg:left-sidebar">
        <NaverMapCanvas
          pois={pois}
          selectedPoiId={selectedPoiId}
          planStopIds={planStopIds}
          onPoiSelect={setSelectedPoiId}
          showAiPill={showAiPill}
          onAiPillDismiss={() => setShowAiPill(false)}
          onAiPillExpand={() => {
            track('ai_open', { entry_point: 'map_pill', locale, screen_id: 'MP_01' })
            setAiOverlayOpen(true)
          }}
          focusPoi={selectedPoi}
          // SavedPoi.primary_image_url is `string | null` (BFF shape); MapPoi
          // wants `string | undefined` — the only field that isn't a direct
          // structural match, normalized here rather than adding a mapping
          // layer for every other already-compatible field.
          restrictToPois={restrictToPois?.map(p => ({ ...p, primary_image_url: p.primary_image_url ?? undefined })) ?? null}
          onBoundsChange={handleBoundsChange}
          poisLoading={poisLoading}
        />

        {/* Plan Pill — mobile, when stops > 0; hidden while the POI sheet covers it (mid/full) */}
        {!(selectedPoiId && !aiOverlayOpen && !planSheetOpen && poiSheetSnap !== 'peek') && (
          <PlanPill
            stopCount={planStopIds.length}
            fromAi={planSource === 'ai'}
            onTap={handlePlanPillTap}
          />
        )}

        {/* Mobile AI FAB + AI Overlay (MP_30–35, FL3_01–08) — hidden, not ready for launch */}
      </div>

      {/* Mobile POI bottom sheet — BS_01–08 */}
      {selectedPoi && (
        <POIBottomSheet
          poi={selectedPoi}
          isOpen={!!selectedPoiId && !aiOverlayOpen && !planSheetOpen}
          isSaved={savedPoiIds.has(selectedPoi.poi_id)}
          isLiked={likedPoiIds.has(selectedPoi.poi_id)}
          isInPlan={planStopIds.includes(selectedPoi.poi_id)}
          planFull={planStopIds.length >= MAX_STOPS}
          onAddToPlan={() => handleAddToPlan(selectedPoi.poi_id)}
          onToggleSave={() => toggleSave(selectedPoi)}
          onToggleLike={() => toggleLike(selectedPoi)}
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
        onDiscardPlan={() => setDiscardConfirmOpen(true)}
        onDismiss={() => setPlanSheetOpen(false)}
        stopDays={stopDays}
        activeDay={activeDay}
        onDayChange={setActiveDay}
      />

      {/* Mobile Saved bottom sheet — H13 (S-IGOSPS), opened via /map?saved=1 */}
      <SavedBottomSheet
        open={savedSheetOpen}
        onClose={() => { setSavedSheetOpen(false); router.replace('/map') }}
        onSelectPoi={(id) => { setSavedSheetOpen(false); router.replace('/map'); setSelectedPoiId(id) }}
        onFolderChange={setRestrictToPois}
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

      {/* UF-6 (G5.6) — discard draft confirm */}
      {discardConfirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-sp-4" style={{ background: 'var(--backdrop-50)' }} role="dialog" aria-modal="true" aria-label={t('plan.discardTitle')}>
          <div className="w-full max-w-[360px] rounded-none p-sp-6 flex flex-col gap-sp-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-start gap-sp-3">
              <AlertTriangle size={20} strokeWidth={2} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-f-lg font-semibold text-fg">{t('plan.discardTitle')}</p>
                <p className="text-f-md text-muted mt-sp-2">{t('plan.discardWarning', { count: planStopIds.length })}</p>
              </div>
            </div>
            <div className="flex gap-sp-3">
              <button onClick={() => setDiscardConfirmOpen(false)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                {t('plan.discardCancel')}
              </button>
              <button onClick={handleConfirmDiscard} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-fg" style={{ background: 'var(--danger)' }}>
                {t('plan.discardConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
