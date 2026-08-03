'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthGate } from '@/contexts/AuthGateContext'
import type { MapPoi } from '@/hooks/useMapPois'

// Single source of truth for POI like-state + toggle, shared by /map (MapView)
// and /place/:id (PlaceDetailClient). Local-optimistic only, with no seed:
// there is no "liked by me" read endpoint (BLK-34 — /api/likes/poi is
// POST/DELETE only), so like-state is genuinely per-session unpersisted today.
// Extracting it here keeps the two mount points identical rather than each
// reinventing the same optimistic-Set behavior; when a GET endpoint lands, the
// seed goes here once.
export function useLikedPois() {
  const { session } = useAuth()
  const { open: openAuthGate } = useAuthGate()

  const [likedPoiIds, setLikedPoiIds] = useState<Set<string>>(new Set())

  const toggleLike = useCallback((poi: MapPoi) => {
    if (!session) { openAuthGate('like'); return }
    const removing = likedPoiIds.has(poi.poi_id)
    setLikedPoiIds(prev => {
      const next = new Set(prev)
      if (removing) next.delete(poi.poi_id)
      else next.add(poi.poi_id)
      return next
    })
    fetch('/api/likes/poi', {
      method:  removing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    }).catch(() => {
      // revert on failure
      setLikedPoiIds(prev => {
        const next = new Set(prev)
        if (removing) next.add(poi.poi_id)
        else next.delete(poi.poi_id)
        return next
      })
    })
  }, [session, likedPoiIds, openAuthGate])

  const isLiked = useCallback((id: string) => likedPoiIds.has(id), [likedPoiIds])

  return { likedPoiIds, isLiked, toggleLike }
}
