'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import NaverMapCanvas from '@/components/map/NaverMapCanvas'
import LeftPanelPOIDetail from '@/components/map/LeftPanel/LeftPanelPOIDetail'
import POIBottomSheet from '@/components/map/POIBottomSheet'
import { useSavedPois } from '@/hooks/useSavedPois'
import { useLikedPois } from '@/hooks/useLikedPois'
import type { MapPoi } from '@/hooks/useMapPois'
// Type-only — lib/place-detail transitively imports the `server-only` bff module.
import type { PlaceDetail } from '@/lib/place-detail'

// Local PlaceDetail → MapPoi mapper, mirroring the codebase's per-consumer
// mapper convention (ItineraryDetailView's stopsToMapPois, useQuickAddToPlan's
// toMapPoi) rather than a shared one. `name` is already the server-resolved
// display name, passed as name_preferred so LeftPanelPOIDetail's getDisplayName
// picks it up unchanged.
function placeToMapPoi(p: PlaceDetail): MapPoi {
  return {
    poi_id:            p.poi_id,
    name_ko:           p.name_ko,
    name_en:           p.name_en,
    name_preferred:    p.name,
    coords_lat:        p.coords_lat,
    coords_lng:        p.coords_lng,
    display_domain:    p.display_domain,
    display_region:    p.display_region ?? undefined,
    description:       p.description,
    address:           p.address,
    primary_image_url: p.primary_image_url,
    save_count:        p.save_count,
    like_count:        p.like_count,
  }
}

// Canonical single-POI page (BLK-11) rendered as the same map+panel surface as
// /map — one NaverMapCanvas reused with single-POI config (focusPoi, no list),
// LeftPanelPOIDetail (desktop) / POIBottomSheet (mobile) shown open by default.
// Save/like use the shared hooks (same source of truth as /map); Add-to-Plan
// and panel-close bridge into /map rather than duplicating the plan builder.
export default function PlaceDetailClient({ place }: { place: PlaceDetail }) {
  const router = useRouter()
  const poi = placeToMapPoi(place)

  const { isSaved, toggleSave } = useSavedPois()
  const { isLiked, toggleLike } = useLikedPois()

  // Opacity reveal on mount — this page has real SSR'd content on screen before
  // hydration, so fade the interactive surface in rather than a hard swap.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { setRevealed(true) }, [])

  const backToMap = () => router.push(`/map?poi=${place.poi_id}`)
  const addToPlan = () => router.push(`/map?poi=${place.poi_id}&addToPlan=1`)

  return (
    <div
      className="fixed top-[50px] lg:top-[56px] left-0 right-0 bottom-14 lg:left-[56px] lg:bottom-0 z-10"
      style={{ opacity: revealed ? 1 : 0, transition: 'opacity var(--dur-reveal) var(--ease-out)' }}
    >
      {/* Desktop panel */}
      <aside
        className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 w-sidebar bg-bg-2"
        aria-label={place.name}
      >
        <LeftPanelPOIDetail
          poi={poi}
          isSaved={isSaved(place.poi_id)}
          isInPlan={false}
          planFull={false}
          onAddToPlan={addToPlan}
          onToggleSave={() => toggleSave(poi)}
          isLiked={isLiked(place.poi_id)}
          onToggleLike={() => toggleLike(poi)}
          onClose={backToMap}
        />
      </aside>

      {/* Map canvas — single-POI config: no list, focusPoi renders the one pin */}
      <div className="absolute inset-0 lg:left-sidebar">
        <NaverMapCanvas
          pois={[]}
          selectedPoiId={place.poi_id}
          planStopIds={[]}
          onPoiSelect={() => {}}
          showAiPill={false}
          onAiPillDismiss={() => {}}
          onAiPillExpand={() => {}}
          focusPoi={poi}
          initialCenter={{ lat: place.coords_lat, lng: place.coords_lng }}
          initialZoom={15}
        />
      </div>

      {/* Mobile bottom sheet — open by default (the page's whole reason to exist) */}
      <POIBottomSheet
        poi={poi}
        isOpen
        isSaved={isSaved(place.poi_id)}
        isLiked={isLiked(place.poi_id)}
        isInPlan={false}
        planFull={false}
        onAddToPlan={addToPlan}
        onToggleSave={() => toggleSave(poi)}
        onToggleLike={() => toggleLike(poi)}
        onDismiss={backToMap}
      />
    </div>
  )
}
