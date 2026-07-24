'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { Plus, Minus, Sparkles, X } from 'lucide-react'
import type { MapPoi } from '@/hooks/useMapPois'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { naver: any }
}

interface Props {
  pois:          MapPoi[]
  selectedPoiId: string | null
  planStopIds:   string[]
  // Real per-leg road paths for a saved itinerary (see lib/itinerary.ts
  // ItineraryLeg.path) — when provided, draws one polyline per leg instead of
  // a single straight connector through planStopIds.
  routeLegs?:    Array<{ path: Array<{ lat: number; lng: number }> }>
  onPoiSelect:   (id: string | null) => void
  showAiPill:    boolean
  onAiPillDismiss: () => void
  onAiPillExpand:  () => void
  // SC-31 (S-HDTVGP) — when a Saved-hub folder is active, only its POIs stay
  // pinned (never clustered — spec: "all folder POIs pinned on map").
  savedFolderPoiIds?: string[] | null
}

const SEOUL = { lat: 37.5665, lng: 126.9780 }
// Naver Maps API requires hex — cannot use CSS var here
const LAV_HEX = '#C4A8E0' // allow-hex — map SDK marker colour

function poiMarkerHtml(poi: MapPoi, selected: boolean): string {
  const sel = selected ? ' poi-selected' : ''
  const tr  = poi.is_trending ? ' poi-trending' : ''
  return `<div class="poi-wrap${sel}${tr}"><div class="poi-dot"></div></div>`
}

function planMarkerHtml(index: number, selected: boolean): string {
  const sel = selected ? ' plan-marker--selected' : ''
  return `<div class="plan-marker${sel}">${index + 1}</div>`
}

function clusterMarkerHtml(count: number): string {
  return `<div class="poi-cluster">${count}</div>`
}

// UF-10 (G3.1) — below this zoom, aggregate nearby POIs into cluster bubbles.
const CLUSTER_ZOOM_THRESHOLD = 12

// Grid resolution (degrees) per zoom level — coarser buckets when zoomed out.
function clusterGridSize(zoom: number): number {
  if (zoom <= 8)  return 0.20
  if (zoom <= 10) return 0.08
  return 0.03
}

export default function NaverMapCanvas({
  pois, selectedPoiId, planStopIds, routeLegs, onPoiSelect,
  showAiPill, onAiPillDismiss, onAiPillExpand,
  savedFolderPoiIds = null,
}: Props) {
  const t = useTranslations('map')
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef       = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef   = useRef<Map<string, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef  = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLegPolylinesRef = useRef<any[]>([])
  const [mapReady, setMapReady]   = useState(false)
  const [scriptErr, setScriptErr] = useState(false)
  const [zoom, setZoom]           = useState(12)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterMarkersRef = useRef<any[]>([])
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

  // The SDK <script> only fires onLoad once per browser session — remounting
  // this component (e.g. navigating away and back) after it already loaded
  // elsewhere means onLoad never fires again, leaving mapReady stuck false
  // forever. Check for the already-loaded SDK on every mount as a fallback.
  useEffect(() => {
    if (window.naver?.maps && !mapRef.current) initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initMap() {
    if (!containerRef.current || !window.naver?.maps || mapRef.current) return
    const map = new window.naver.maps.Map(containerRef.current, {
      center:         new window.naver.maps.LatLng(SEOUL.lat, SEOUL.lng),
      zoom:           12,
      mapTypeControl: false,
      scaleControl:   false,
      logoControl:    true,
      mapDataControl: false,
      zoomControl:    false,
    })
    mapRef.current = map

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.naver.maps.Event.addListener(map, 'click', (e: any) => {
      const target = e.domEvent?.target as HTMLElement | undefined
      if (target?.closest?.('.poi-wrap, .plan-marker, .poi-cluster')) return
      onPoiSelect(null)
    })

    // UF-10 (G3.1) — track zoom so the marker-sync effect can re-cluster on zoom change.
    window.naver.maps.Event.addListener(map, 'zoom_changed', () => setZoom(map.getZoom()))

    setMapReady(true)
  }

  // Sync markers — regular POIs + plan numbered markers.
  // Plan-stop POIs are never clustered — they're the numbered route, always visible.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps) return
    const map = mapRef.current
    const clusterActive = zoom <= CLUSTER_ZOOM_THRESHOLD && !savedFolderPoiIds

    const visiblePois = savedFolderPoiIds
      ? pois.filter(p => savedFolderPoiIds.includes(p.poi_id))
      : pois

    const planPois = visiblePois.filter(p => planStopIds.includes(p.poi_id))
    const freePois = visiblePois.filter(p => !planStopIds.includes(p.poi_id))

    // Bucket free POIs into a lat/lng grid at the current zoom's resolution.
    // Cells with 2+ members become a cluster bubble; singletons render as normal dots.
    const gridSize = clusterGridSize(zoom)
    const buckets = new Map<string, MapPoi[]>()
    if (clusterActive) {
      freePois.forEach(poi => {
        const key = `${Math.floor(poi.coords_lat / gridSize)}:${Math.floor(poi.coords_lng / gridSize)}`
        const bucket = buckets.get(key)
        if (bucket) bucket.push(poi); else buckets.set(key, [poi])
      })
    }

    const clusteredIds = new Set<string>()
    const clusterGroups: MapPoi[][] = []
    if (clusterActive) {
      buckets.forEach(members => {
        if (members.length >= 2) {
          clusterGroups.push(members)
          members.forEach(m => clusteredIds.add(m.poi_id))
        }
      })
    }

    const individualPois = [...planPois, ...freePois.filter(p => !clusteredIds.has(p.poi_id))]
    const liveIds = new Set(individualPois.map(p => p.poi_id))

    markersRef.current.forEach((marker, id) => {
      if (!liveIds.has(id)) { marker.setMap(null); markersRef.current.delete(id) }
    })

    individualPois.forEach(poi => {
      const selected   = poi.poi_id === selectedPoiId
      const planIndex  = planStopIds.indexOf(poi.poi_id)
      const isInPlan   = planIndex !== -1
      const content    = isInPlan
        ? planMarkerHtml(planIndex, selected)
        : poiMarkerHtml(poi, selected)

      if (markersRef.current.has(poi.poi_id)) {
        markersRef.current.get(poi.poi_id)!.setIcon({
          content,
          size:   new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12),
        })
        return
      }

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(poi.coords_lat, poi.coords_lng),
        map,
        icon: {
          content,
          size:   new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12),
        },
        title:  poi.name_en,
        cursor: 'pointer',
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        map.panTo(new window.naver.maps.LatLng(poi.coords_lat, poi.coords_lng))
        onPoiSelect(poi.poi_id)
      })
      markersRef.current.set(poi.poi_id, marker)
    })

    // Cluster bubbles — rebuilt fresh each pass (cheap: bounded by visible POI count).
    clusterMarkersRef.current.forEach(m => m.setMap(null))
    clusterMarkersRef.current = clusterGroups.map(members => {
      const centerLat = members.reduce((sum, p) => sum + p.coords_lat, 0) / members.length
      const centerLng = members.reduce((sum, p) => sum + p.coords_lng, 0) / members.length

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(centerLat, centerLng),
        map,
        icon: {
          content: clusterMarkerHtml(members.length),
          size:    new window.naver.maps.Size(32, 32),
          anchor:  new window.naver.maps.Point(16, 16),
        },
        cursor: 'pointer',
        zIndex: 50,
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        map.setCenter(new window.naver.maps.LatLng(centerLat, centerLng))
        map.setZoom(Math.min(zoom + 2, 18))
      })

      return marker
    })
  }, [mapReady, pois, selectedPoiId, planStopIds, onPoiSelect, zoom, savedFolderPoiIds])

  // MP_20 — Route polyline connecting plan stops.
  // routeLegs (from a saved itinerary's real routing.route_leg results) draws
  // one polyline per leg along its actual road path; day boundaries are
  // already excluded upstream (no leg entry = no line drawn between them).
  // Without routeLegs (the live map builder, no computed route yet), fall
  // back to a single straight connector through planStopIds in order.
  useEffect(() => {
    if (!mapReady || !window.naver?.maps) return
    polylineRef.current?.setMap(null)
    polylineRef.current = null
    routeLegPolylinesRef.current.forEach(pl => pl.setMap(null))
    routeLegPolylinesRef.current = []

    if (routeLegs && routeLegs.length > 0) {
      routeLegPolylinesRef.current = routeLegs
        .filter(leg => leg.path.length >= 2)
        .map(leg => new window.naver.maps.Polyline({
          path:          leg.path.map(p => new window.naver.maps.LatLng(p.lat, p.lng)),
          strokeColor:   LAV_HEX,
          strokeOpacity: 0.85,
          strokeWeight:  3,
          strokeStyle:   'solid',
          map:           mapRef.current,
        }))
      return
    }

    if (planStopIds.length < 2) return

    const coords = planStopIds
      .map(id => pois.find(p => p.poi_id === id))
      .filter((p): p is MapPoi => !!p)
      .map(p => new window.naver.maps.LatLng(p.coords_lat, p.coords_lng))

    if (coords.length < 2) return

    polylineRef.current = new window.naver.maps.Polyline({
      path:           coords,
      strokeColor:    LAV_HEX,
      strokeOpacity:  0.85,
      strokeWeight:   3,
      strokeStyle:    'solid',
      map:            mapRef.current,
    })
  }, [mapReady, planStopIds, pois, routeLegs])

  useEffect(() => () => {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(m => m.setMap(null))
    clusterMarkersRef.current = []
    polylineRef.current?.setMap(null)
    routeLegPolylinesRef.current.forEach(pl => pl.setMap(null))
  }, [])

  function zoomIn()  { mapRef.current?.setZoom(Math.min(mapRef.current.getZoom() + 1, 18)) }
  function zoomOut() { mapRef.current?.setZoom(Math.max(mapRef.current.getZoom() - 1, 5)) }

  // ─── No API key ──────────────────────────────────────────────
  if (!clientId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-bg-3 gap-sp-3">
        <div className="w-10 h-10 rounded-full bg-muted-3 flex items-center justify-center">
          <span className="text-muted text-xl">🗺</span>
        </div>
        <p className="text-muted text-sm text-center px-sp-6">{t('noKey')}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* MP_10 — Dim overlay on POI selection */}
      {selectedPoiId && mapReady && (
        <div
          className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-300"
          style={{ background: 'var(--backdrop-50)', opacity: 0.18 }}
          aria-hidden="true"
        />
      )}

      {/* Naver Maps SDK */}
      {!scriptErr && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
          strategy="afterInteractive"
          onLoad={initMap}
          onError={() => setScriptErr(true)}
        />
      )}

      {/* Map container */}
      <div
        ref={containerRef}
        className="w-full h-full naver-map-dark"
        role="application"
        aria-label={t('ariaLabel')}
      />

      {/* Loading state — mono dots, no spinner (DESIGN.md loading-state rule) */}
      {!mapReady && !scriptErr && (
        <div className="absolute inset-0 bg-bg-3 flex flex-col items-center justify-center gap-sp-3">
          <p className="text-muted text-sm font-mono">{t('loading')}</p>
        </div>
      )}

      {/* SC-32 (ERR_01) — error notice overlays the canvas rather than replacing
          it, so whatever last rendered (map/POI pins) stays visible underneath. */}
      {scriptErr && (
        <div className="absolute inset-0 flex items-end sm:items-center justify-center pointer-events-none px-sp-4 pb-sp-6 sm:pb-0">
          <div
            className="pointer-events-auto flex flex-col items-center gap-sp-2 text-center px-sp-6 py-sp-4"
            style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--bdr)' }}
          >
            <p className="text-fg text-sm font-semibold">{t('error')}</p>
            <button onClick={() => setScriptErr(false)} className="text-lav text-sm hover:underline min-h-touch flex items-center">
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls — MP_07, MP_08 — desktop only */}
      {mapReady && (
        <div className="hidden lg:flex absolute bottom-sp-8 right-sp-4 flex-col z-10" style={{ filter: 'drop-shadow(0 2px 4px var(--backdrop-50))' }}>
          <button onClick={zoomIn} aria-label={t('zoomIn')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-none hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--bdr)' }}>
            <Plus size={16} strokeWidth={2} />
          </button>
          <button onClick={zoomOut} aria-label={t('zoomOut')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-none hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--bdr)', borderTop: 'none' }}>
            <Minus size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Desktop AI open button — MP_30 — hidden, AI assistant not ready for launch */}

      {/* AI Pill — MP_06 */}
      {showAiPill && mapReady && (
        <div className="absolute bottom-sp-8 right-[calc(var(--touch-min)+var(--sp-5))] z-10 flex items-center gap-sp-2 h-touch px-sp-3 bg-bg-2 rounded-full" style={{ border: '1px solid var(--lav-border)' }}>
          <Sparkles size={14} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
          <button onClick={onAiPillExpand} className="text-sm text-fg hover:text-lav transition-colors whitespace-nowrap" aria-label={t('aiPill.expand')}>
            {t('aiPill.label')}
          </button>
          <button onClick={onAiPillDismiss} aria-label={t('aiPill.dismiss')} className="text-muted hover:text-fg transition-colors">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
