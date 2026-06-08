'use client'

import LeftPanelDefault from './LeftPanelDefault'
import LeftPanelPOIDetail from './LeftPanelPOIDetail'
import LeftPanelPlanActive from './LeftPanelPlanActive'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  pois:             MapPoi[]
  selectedPoiId:    string | null
  activeRegion:     string | null
  activeFilters:    string[]
  planStops:        MapPoi[]
  stopDurations:    Record<string, number>
  transport:        'car' | 'public'
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
  onTransportChange:(mode: 'car' | 'public') => void
  onSavePlan:       () => void
}

export default function LeftPanel({
  pois, selectedPoiId,
  activeRegion, activeFilters, onRegionToggle, onFilterToggle,
  planStops, stopDurations, transport,
  isSaved, isInPlan, planFull, onAddToPlan, onToggleSave,
  onReorder, onRemove, onDurationChange, onTransportChange, onSavePlan,
}: Props) {
  // Priority: POI selected > plan active > default
  const selectedPoi = selectedPoiId
    ? pois.find(p => p.place_id === selectedPoiId) ?? null
    : null

  if (selectedPoi) {
    return (
      <LeftPanelPOIDetail
        poi={selectedPoi}
        isSaved={isSaved(selectedPoi.place_id)}
        isInPlan={isInPlan(selectedPoi.place_id)}
        planFull={planFull}
        onAddToPlan={() => onAddToPlan(selectedPoi.place_id)}
        onToggleSave={() => onToggleSave(selectedPoi)}
      />
    )
  }

  if (planStops.length > 0) {
    return (
      <LeftPanelPlanActive
        stops={planStops}
        stopDurations={stopDurations}
        transport={transport}
        onReorder={onReorder}
        onRemove={onRemove}
        onDurationChange={onDurationChange}
        onTransportChange={onTransportChange}
        onSave={onSavePlan}
      />
    )
  }

  return (
    <LeftPanelDefault
      activeRegion={activeRegion}
      activeFilters={activeFilters}
      onRegionToggle={onRegionToggle}
      onFilterToggle={onFilterToggle}
    />
  )
}
