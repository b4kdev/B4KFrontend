'use client'

import { useEffect, useState } from 'react'
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
import { useMapPois } from '@/hooks/useMapPois'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import { getDraftPlan, saveDraftPlan, clearDraftPlan } from '@/lib/draft-plan'
import type { MapPoi } from '@/hooks/useMapPois'

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
  const [stopDurations, setStopDurations] = useState<Record<string, number>>({})
  const [planSheetOpen, setPlanSheetOpen] = useState(false)

  const { pois } = useMapPois(activeRegion, activeFilters)

  // Restore draft plan from sessionStorage on mount (e.g. returning from Plan Preview)
  useEffect(() => {
    const draft = getDraftPlan()
    if (!draft || draft.stops.length === 0) return
    const ids = draft.stops.map(s => s.place_id)
    setPlanStopIds(ids)
    setStopDurations(draft.durations)
    clearDraftPlan()
  }, [])

  // Ordered stop POIs for LeftPanel and polyline
  const planStops = planStopIds
    .map(id => pois.find(p => p.place_id === id))
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
    setPlanStopIds(prev => [...prev, poiId])
    setStopDurations(prev => ({ ...prev, [poiId]: DEFAULT_DURATION }))
    showToast(t('poiDetail.addedToast'))
  }

  function handleRemoveFromPlan(poiId: string) {
    setPlanStopIds(prev => prev.filter(id => id !== poiId))
    setStopDurations(prev => { const next = { ...prev }; delete next[poiId]; return next })
  }

  function handleToggleSave(poi: MapPoi) {
    if (!session) { openAuthGate('save_poi'); return }
    setSavedPoiIds(prev => {
      const next = new Set(prev)
      if (next.has(poi.place_id)) {
        next.delete(poi.place_id)
        showToast(t('poiDetail.removedSave'), 'info')
      } else {
        next.add(poi.place_id)
        showToast(t('poiDetail.savedToast'))
      }
      return next
    })
  }

  function handleReorder(newOrder: string[]) {
    setPlanStopIds(newOrder)
  }

  function handleDurationChange(id: string, minutes: number) {
    setStopDurations(prev => ({ ...prev, [id]: minutes }))
  }

  async function handlePreviewPlan() {
    if (!session) { openAuthGate('save_plan'); return }
    saveDraftPlan({ stops: planStops, durations: stopDurations })
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `My Plan · ${new Date().toLocaleDateString()}`,
          stops: planStops.map((s, i) => ({
            poi_id: s.place_id,
            stop_order: i + 1,
            duration_min: stopDurations[s.place_id] ?? 60,
          })),
          is_published: false,
        }),
      })
      if (!res.ok) throw new Error()
      const { plan } = await res.json()
      clearDraftPlan()
      router.push(`/itinerary/${plan.id}`)
    } catch {
      showToast(t('plan.saveError'), 'error')
    }
  }

  function handlePlanPillTap() {
    setSelectedPoiId(null)
    setPlanSheetOpen(true)
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

        {/* Plan Pill — mobile, when stops > 0 */}
        <PlanPill
          stopCount={planStopIds.length}
          onTap={handlePlanPillTap}
        />

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
          isInPlan={planStopIds.includes(selectedPoi.place_id)}
          planFull={planStopIds.length >= MAX_STOPS}
          onAddToPlan={() => handleAddToPlan(selectedPoi.place_id)}
          onToggleSave={() => handleToggleSave(selectedPoi)}
          onDismiss={() => setSelectedPoiId(null)}
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
    </div>
  )
}
