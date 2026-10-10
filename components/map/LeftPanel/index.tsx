'use client'

import { useState } from 'react'
import LeftPanelDefault from './LeftPanelDefault'
import LeftPanelPOIDetail from './LeftPanelPOIDetail'
import LeftPanelPlanActive from './LeftPanelPlanActive'
import LeftPanelSavedHub from './LeftPanelSavedHub'
import PlanStrip from './PlanStrip'
import type { MapPoi } from '@/hooks/useMapPois'
import type { SavedPoi } from '@/app/api/saved/route'

interface Props {
  pois:             MapPoi[]
  selectedPoi:      MapPoi | null
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
  isLiked:          boolean
  onToggleLike:     () => void
  onReorder:        (newOrder: string[]) => void
  onRemove:         (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
  onPreviewPlan:    () => void
  onDiscardPlan:    () => void
  stopDays:         Record<string, number>
  activeDay:        number
  onDayChange:      (day: number) => void
  dayCount:         number
  onAddDay:         () => void
  onRemoveDay:      (day: number) => void
  planExpanded:         boolean
  onPlanExpandedChange: (expanded: boolean) => void
  onClosePoi:       () => void
  onSelectPoi:      (id: string) => void
  poisLoading:      boolean
  poisError:        boolean
  savedHubOpen:        boolean
  onOpenSaved:         () => void
  onCloseSavedHub:     () => void
  onSavedFolderChange: (pois: SavedPoi[] | null) => void
}

export default function LeftPanel({
  pois, selectedPoi,
  activeRegion, activeFilters, onRegionToggle, onFilterToggle,
  planStops, stopDurations,
  isSaved, isInPlan, planFull, onAddToPlan, onToggleSave,
  isLiked, onToggleLike,
  onReorder, onRemove, onDurationChange, onPreviewPlan, onDiscardPlan,
  stopDays, activeDay, onDayChange, dayCount, onAddDay, onRemoveDay, planExpanded, onPlanExpandedChange, onClosePoi, onSelectPoi,
  poisLoading, poisError,
  savedHubOpen, onOpenSaved, onCloseSavedHub, onSavedFolderChange,
}: Props) {
  // "내 플랜" 에서 장소를 눌러 상세로 들어왔으면, 상세를 닫을 때 다시 플랜으로 돌아간다.
  const [returnToPlan, setReturnToPlan] = useState(false)

  function handleSelectStop(id: string) {
    setReturnToPlan(true)
    onPlanExpandedChange(false)
    onSelectPoi(id)
  }

  function handleClosePoi() {
    onClosePoi()
    if (returnToPlan) { setReturnToPlan(false); onPlanExpandedChange(true) }
  }

  const hasPlan = planStops.length > 0

  // State B: plan strip expanded → full-height plan active panel
  if (hasPlan && planExpanded) {
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
            dayCount={dayCount}
            onAddDay={onAddDay}
            onRemoveDay={onRemoveDay}
            onSelectStop={handleSelectStop}
          />
        </div>
        <PlanStrip
          stopCount={planStops.length}
          expanded={planExpanded}
          onToggle={() => onPlanExpandedChange(false)}
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
            isSaved={isSaved(selectedPoi.poi_id)}
            isInPlan={isInPlan(selectedPoi.poi_id)}
            planFull={planFull}
            onAddToPlan={() => onAddToPlan(selectedPoi.poi_id)}
            onToggleSave={() => onToggleSave(selectedPoi)}
            isLiked={isLiked}
            onToggleLike={onToggleLike}
            onClose={handleClosePoi}
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
            onOpenSaved={onOpenSaved}
            isInPlan={isInPlan}
            planFull={planFull}
            onAddToPlan={onAddToPlan}
          />
        )}
      </div>
      {hasPlan && (
        <PlanStrip
          stopCount={planStops.length}
          expanded={planExpanded}
          onToggle={() => { setReturnToPlan(false); onPlanExpandedChange(true) }}
        />
      )}
    </div>
  )
}
