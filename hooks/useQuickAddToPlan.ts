'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getDraftPlan, saveDraftPlan } from '@/lib/draft-plan'
import { MAX_STOPS } from '@/lib/plan-constants'
import { useToast } from '@/contexts/ToastContext'
import type { MapPoi } from '@/hooks/useMapPois'

export interface QuickAddPoi {
  id: string
  name_ko: string
  name_en: string
  coords_lat: number
  coords_lng: number
  display_region: string
  display_domain?: string
  is_trending?: boolean
  is_partner?: boolean
  quality_score?: number
  primary_image_url?: string | null
}

function toMapPoi(poi: QuickAddPoi): MapPoi {
  return {
    poi_id:            poi.id,
    name_ko:           poi.name_ko,
    name_en:           poi.name_en,
    coords_lat:        poi.coords_lat,
    coords_lng:        poi.coords_lng,
    display_domain:    poi.display_domain ?? '',
    display_region:    poi.display_region,
    is_trending:       poi.is_trending ?? false,
    is_partner:        poi.is_partner ?? false,
    quality_score:     poi.quality_score ?? 0,
    primary_image_url: poi.primary_image_url ?? undefined,
  }
}

// Quick "Add to Plan" from a POI card (Home/Explore) — same guest localStorage
// draft the map page reads on load (DEC-13: build phase is guest-free, no
// auth gate). Real DB-draft-vs-localStorage reconciliation for logged-in
// users is unbuilt everywhere else too (/api/plans/draft GET is a stub that
// always returns null) — nothing to conflict with yet.
export function useQuickAddToPlan(poi: QuickAddPoi) {
  const t = useTranslations('map.poiDetail')
  const { showToast } = useToast()
  const [inPlan, setInPlan] = useState(() => {
    if (typeof window === 'undefined') return false
    return getDraftPlan()?.stops.some(s => s.poi_id === poi.id) ?? false
  })

  const addToPlan = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (inPlan) return

    const draft = getDraftPlan() ?? { stops: [], durations: {} }
    if (draft.stops.length >= MAX_STOPS) {
      showToast(t('planFull'), 'error')
      return
    }

    saveDraftPlan({
      ...draft,
      stops: [...draft.stops, toMapPoi(poi)],
      durations: { ...draft.durations, [poi.id]: 60 },
    })
    setInPlan(true)
    showToast(t('addedToast'))
  }, [poi, inPlan, showToast, t])

  return { inPlan, addToPlan }
}
