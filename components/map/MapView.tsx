'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Sparkles } from 'lucide-react'
import NaverMapCanvas from './NaverMapCanvas'
import LeftPanel from './LeftPanel/index'
import AIOverlay from './AIOverlay'
import { useMapPois } from '@/hooks/useMapPois'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import type { MapPoi } from '@/hooks/useMapPois'

const MAX_STOPS = 10
const DEFAULT_DURATION = 60

export default function MapView() {
  const t = useTranslations('map')
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
  const [transport, setTransport]         = useState<'car' | 'public'>('car')

  const { pois } = useMapPois(activeRegion, activeFilters)

  // Ordered stop POIs for LeftPanel and polyline
  const planStops = planStopIds
    .map(id => pois.find(p => p.place_id === id))
    .filter((p): p is MapPoi => !!p)

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
    if (!session) { openAuthGate('save'); return }
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

  function handleSavePlan() {
    if (!session) { openAuthGate('plan'); return }
    // TODO: POST /api/plan/save when backend ready
    showToast(t('plan.savedToast'))
  }

  function handleUsePlan(stops: MapPoi[]) {
    setPlanStopIds([])
    setStopDurations({})
    stops.forEach(poi => {
      setPlanStopIds(prev => prev.includes(poi.place_id) ? prev : [...prev, poi.place_id])
      setStopDurations(prev => ({ ...prev, [poi.place_id]: DEFAULT_DURATION }))
    })
    setAiOverlayOpen(false)
    setShowAiPill(true)
  }

  return (
    <div className="fixed top-[52px] left-0 right-0 bottom-14 lg:left-[52px] lg:bottom-0 z-10">

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
          transport={transport}
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
          onTransportChange={setTransport}
          onSavePlan={handleSavePlan}
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
          onUsePlan={handleUsePlan}
          onMinimize={() => { setAiOverlayOpen(false); setShowAiPill(true) }}
          onClose={() => setAiOverlayOpen(false)}
        />
      </div>
    </div>
  )
}
