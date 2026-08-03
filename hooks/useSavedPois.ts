'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import { useSaved } from '@/hooks/useSaved'
import { track } from '@/lib/analytics'
import type { MapPoi } from '@/hooks/useMapPois'

// Single source of truth for POI save-state + toggle, shared by /map (MapView)
// and the canonical /place/:id page (PlaceDetailClient) so the two can't drift.
// Set-based so the map (many POIs) and the single-POI page use the same hook:
// isSaved(id) covers both. Optimistic local Set is the display source (not the
// SWR data), seeded once from /api/saved so a user's own toggles this session
// aren't overwritten by a revalidation.
export function useSavedPois() {
  const t = useTranslations('map')
  const locale = useLocale()
  const { session } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const { showToast } = useToast()
  const { data: savedData, mutate: mutateSaved } = useSaved()

  const [savedPoiIds, setSavedPoiIds] = useState<Set<string>>(new Set())
  const seededRef = useRef(false)

  // Seed from API on first load — one-time only so local toggles aren't overwritten.
  useEffect(() => {
    if (seededRef.current || !savedData?.pois) return
    seededRef.current = true
    setSavedPoiIds(new Set(savedData.pois.map(p => p.poi_id)))
  }, [savedData])

  const toggleSave = useCallback((poi: MapPoi) => {
    if (!session) { openAuthGate('save_poi'); return }
    const removing = savedPoiIds.has(poi.poi_id)
    setSavedPoiIds(prev => {
      const next = new Set(prev)
      if (removing) {
        next.delete(poi.poi_id)
        showToast(t('poiDetail.removedSave'), 'info')
      } else {
        next.add(poi.poi_id)
        showToast(t('poiDetail.savedToast'))
        track('poi_save', { poi_id: poi.poi_id, region: poi.display_region ?? undefined, locale, screen_id: 'MP_01' })
      }
      return next
    })
    fetch('/api/saved/poi', {
      method:  removing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    })
      .then(() => mutateSaved())
      .catch(() => {})
  }, [session, savedPoiIds, openAuthGate, showToast, t, locale, mutateSaved])

  const isSaved = useCallback((id: string) => savedPoiIds.has(id), [savedPoiIds])

  return { savedPoiIds, isSaved, toggleSave }
}
