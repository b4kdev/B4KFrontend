'use client'

import { useState } from 'react'
import LeftPanelDefault from './LeftPanelDefault'
import LeftPanelPOIDetail from './LeftPanelPOIDetail'
import LeftPanelPlanActive from './LeftPanelPlanActive'
import LeftPanelSavedHub from './LeftPanelSavedHub'
import PlanStrip from './PlanStrip'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  pois:             MapPoi[]
  selectedPoiId:    string | null
  activeRegion:     string | null
  activeFilters:    string[]
  planStops:        MapPoi[]
  stopDurations:    Record<string, number>
  onRegionToggle:   (region: string) => void
  onFilterToggle:   (filter: string) => void
  isSaved:          (id: string) => boolean
  isInPlan:         (id: string) => boolean
  planFull:         boolean
  onAddToPlan:      (id: string) => void
  onToggleSave:     (poi: MapPoi) => void
  onReorder:        (newOrder: string[]) => void
  onRemove:         (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
  onPreviewPlan:    () => void
  onDiscardPlan:    () => void
  stopDays:         Record<string, number>
  activeDay:        number
  onDayChange:      (day: number) => void
  onClosePoi:       () => void
  onSelectPoi:      (id: string) => void
  poisLoading:      boolean
  poisError:        boolean
  savedHubOpen:        boolean
  onCloseSavedHub:     () => void
  onSavedFolderChange: (poiIds: string[] | null) => void
}

export default function LeftPanel({
  pois, selectedPoiId,
  activeRegion, activeFilters, onRegionToggle, onFilterToggle,
  planStops, stopDurations,
  isSaved, isInPlan, planFull, onAddToPlan, onToggleSave,
  onReorder, onRemove, onDurationChange, onPreviewPlan, onDiscardPlan,
  stopDays, activeDay, onDayChange, onClosePoi, onSelectPoi,
  poisLoading, poisError,
  savedHubOpen, onCloseSavedHub, onSavedFolderChange,
}: Props) {
  const [planStripExpanded, setPlanStripExpanded] = useState(false)

  const hasPlan = planStops.length > 0

  const selectedPoi = selectedPoiId
    ? pois.find(p => p.place_id === selectedPoiId) ?? null
    : null

  // State B: plan strip expanded → full-height plan active panel
  if (hasPlan && planStripExpanded) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0">
          <LeftPanelPlanActive
            stops={planStops}
            stopDurations={stopDurations}
            onReorder={onReorder}
            onRemove={onRemove}
            onDurationChange={onDurationChange}
            onPreviewPlan={onPreviewPlan}
            onDiscardPlan={onDiscardPlan}
            stopDays={stopDays}
            activeDay={activeDay}
            onDayChange={onDayChange}
          />
        </div>
        <PlanStrip
          stopCount={planStops.length}
          expanded={planStripExpanded}
          onToggle={() => setPlanStripExpanded(false)}
        />
      </div>
    )
  }

  // State A: top zone (POI detail or Default) + collapsed plan strip when stops > 0
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {selectedPoi ? (
          <LeftPanelPOIDetail
            poi={selectedPoi}
            isSaved={isSaved(selectedPoi.place_id)}
            isInPlan={isInPlan(selectedPoi.place_id)}
            planFull={planFull}
            onAddToPlan={() => onAddToPlan(selectedPoi.place_id)}
            onToggleSave={() => onToggleSave(selectedPoi)}
            onClose={onClosePoi}
          />
        ) : savedHubOpen ? (
          <LeftPanelSavedHub
            onClose={onCloseSavedHub}
            onSelectPoi={onSelectPoi}
            onFolderChange={onSavedFolderChange}
          />
        ) : (
          <LeftPanelDefault
            pois={pois}
            isLoading={poisLoading}
            isError={poisError}
            activeRegion={activeRegion}
            activeFilters={activeFilters}
            onRegionToggle={onRegionToggle}
            onFilterToggle={onFilterToggle}
            isSaved={isSaved}
            onSelectPoi={onSelectPoi}
            onToggleSave={onToggleSave}
          />
        )}
      </div>
      {hasPlan && (
        <PlanStrip
          stopCount={planStops.length}
          expanded={planStripExpanded}
          onToggle={() => setPlanStripExpanded(true)}
        />
      )}
    </div>
  )
}
