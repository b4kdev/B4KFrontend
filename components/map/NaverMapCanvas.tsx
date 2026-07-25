'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { Plus, Minus, Sparkles, X } from 'lucide-react'
import type { MapPoi, MapBounds } from '@/hooks/useMapPois'

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
  // Viewport-bounds fetching — fired on 'idle' (debounced, padded, threshold-
  // gated below), so useMapPois can request POIs in the visible area instead
  // of a fixed nationwide top-N. Omitted/no calls yet → caller stays on its
  // no-bounds fallback (nationwide top-N) until the first idle settles.
  onBoundsChange?: (bounds: MapBounds, zoom: number) => void
}

// Extra margin around the viewport so panning within it doesn't need an
// immediate refetch — total span ends up ~1.3x the visible width/height.
const BOUNDS_PADDING_RATIO = 0.15
// Skip a refetch unless the new bounds moved at least this fraction of the
// previous request's span — avoids re-querying on trivial nudges.
const BOUNDS_MOVE_THRESHOLD = 0.3
// Debounce after 'idle' — collapses rapid stop/move/stop sequences (e.g.
// scroll-wheel zoom bursts) into a single request.
const BOUNDS_DEBOUNCE_MS = 800

function paddedBounds(map: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBounds: () => any
}): MapBounds {
  const b   = map.getBounds()
  const sw  = b.getSW()
  const ne  = b.getNE()
  const latSpan = ne.lat() - sw.lat()
  const lngSpan = ne.lng() - sw.lng()
  const latPad  = latSpan * BOUNDS_PADDING_RATIO
  const lngPad  = lngSpan * BOUNDS_PADDING_RATIO
  return {
    minLat: sw.lat() - latPad,
    maxLat: ne.lat() + latPad,
    minLng: sw.lng() - lngPad,
    maxLng: ne.lng() + lngPad,
  }
}

function movedPastThreshold(prev: MapBounds | null, next: MapBounds): boolean {
  if (!prev) return true
  const prevLatSpan = prev.maxLat - prev.minLat
  const prevLngSpan = prev.maxLng - prev.minLng
  const latMove = Math.max(Math.abs(next.minLat - prev.minLat), Math.abs(next.maxLat - prev.maxLat))
  const lngMove = Math.max(Math.abs(next.minLng - prev.minLng), Math.abs(next.maxLng - prev.maxLng))
  return latMove > prevLatSpan * BOUNDS_MOVE_THRESHOLD || lngMove > prevLngSpan * BOUNDS_MOVE_THRESHOLD
}

const SEOUL = { lat: 37.5665, lng: 126.9780 }
// Naver Maps API requires hex — cannot use CSS var here
const MAP_PIN_HEX = '#FB2BDD' // allow-hex — map SDK route colour, matches --map-pin

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
// Raised from 12 — viewport-bbox fetching (vs. the old nationwide top-100)
// surfaces real POI density, and central Seoul districts have hundreds of
// POIs even at a "browsing a neighborhood" zoom. Clustering now stays on
// through that range and only turns off once individual buildings are
// legible (~street level).
const CLUSTER_ZOOM_THRESHOLD = 15

// Grid resolution (degrees) per zoom level — coarser buckets when zoomed out.
function clusterGridSize(zoom: number): number {
  if (zoom <= 8)  return 0.20
  if (zoom <= 10) return 0.08
  if (zoom <= 12) return 0.03
  if (zoom <= 14) return 0.012
  return 0.005
}

export default function NaverMapCanvas({
  pois, selectedPoiId, planStopIds, routeLegs, onPoiSelect,
  showAiPill, onAiPillDismiss, onAiPillExpand,
  savedFolderPoiIds = null,
  onBoundsChange,
}: Props) {
  const t = useTranslations('map')
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef       = useRef<any>(null)
  // Keyed by poi_id → {marker, content}. `content` is the last icon HTML we
  // set, so the sync effect below can skip setIcon() when nothing actually
  // changed instead of re-rendering every marker's icon on every selection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef   = useRef<Map<string, { marker: any; content: string }>>(new Map())
  // Last-rendered cluster grouping signature (sorted member ids per group,
  // joined) — lets the cluster-rebuild step below skip the expensive full
  // teardown/recreate when the grouping itself hasn't changed (e.g. only
  // selectedPoiId changed, which never affects cluster membership).
  const lastClusterSigRef = useRef<string>('')
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

  // Viewport-bounds fetch bookkeeping — refs so the 'idle' listener (registered
  // once in initMap) always reads the latest callback/last-requested-bounds
  // without needing to re-register on every render.
  const onBoundsChangeRef = useRef(onBoundsChange)
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])
  const lastBoundsRef = useRef<MapBounds | null>(null)
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    // Viewport-bounds fetch — only fires once movement fully stops (idle),
    // never mid-drag/mid-zoom. Debounced + threshold-gated (see constants
    // above) on top of that so light exploration doesn't spam requests.
    window.naver.maps.Event.addListener(map, 'idle', () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        const next = paddedBounds(map)
        if (!movedPastThreshold(lastBoundsRef.current, next)) return
        lastBoundsRef.current = next
        onBoundsChangeRef.current?.(next, map.getZoom())
      }, BOUNDS_DEBOUNCE_MS)
    })

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

    const clusteredIds = new Set<string>()
    const clusterGroups: MapPoi[][] = []

    // Same-point grouping — independent of zoom/CLUSTER_ZOOM_THRESHOLD. Some
    // POIs share near-identical coordinates regardless of how far in you zoom
    // (e.g. every tenant store inside one department store inherits the
    // building's single geocoded point — a data issue, not a rendering one).
    // Zooming in never separates these, so they must always collapse into one
    // bubble or they'd render as literally-overlapping, unclickable dots.
    // Rounds to 5 decimals (~1m) — tight enough to only catch true duplicates,
    // not just-nearby distinct storefronts.
    if (!savedFolderPoiIds) {
      const samePointBuckets = new Map<string, MapPoi[]>()
      freePois.forEach(poi => {
        const key = `${poi.coords_lat.toFixed(5)}:${poi.coords_lng.toFixed(5)}`
        const bucket = samePointBuckets.get(key)
        if (bucket) bucket.push(poi); else samePointBuckets.set(key, [poi])
      })
      samePointBuckets.forEach(members => {
        if (members.length >= 2) {
          clusterGroups.push(members)
          members.forEach(m => clusteredIds.add(m.poi_id))
        }
      })
    }

    // Bucket the remaining free POIs into a lat/lng grid at the current zoom's
    // resolution. Cells with 2+ members become a cluster bubble; singletons
    // render as normal dots. Only active below CLUSTER_ZOOM_THRESHOLD — past
    // that, individual buildings are legible so distinct-but-nearby POIs stay
    // as separate pins (same-point grouping above still applies regardless).
    const gridSize = clusterGridSize(zoom)
    if (clusterActive) {
      const buckets = new Map<string, MapPoi[]>()
      freePois.forEach(poi => {
        if (clusteredIds.has(poi.poi_id)) return
        const key = `${Math.floor(poi.coords_lat / gridSize)}:${Math.floor(poi.coords_lng / gridSize)}`
        const bucket = buckets.get(key)
        if (bucket) bucket.push(poi); else buckets.set(key, [poi])
      })
      buckets.forEach(members => {
        if (members.length >= 2) {
          clusterGroups.push(members)
          members.forEach(m => clusteredIds.add(m.poi_id))
        }
      })
    }

    const individualPois = [...planPois, ...freePois.filter(p => !clusteredIds.has(p.poi_id))]
    const liveIds = new Set(individualPois.map(p => p.poi_id))

    markersRef.current.forEach(({ marker }, id) => {
      if (!liveIds.has(id)) { marker.setMap(null); markersRef.current.delete(id) }
    })

    individualPois.forEach(poi => {
      const selected   = poi.poi_id === selectedPoiId
      const planIndex  = planStopIds.indexOf(poi.poi_id)
      const isInPlan   = planIndex !== -1
      const content    = isInPlan
        ? planMarkerHtml(planIndex, selected)
        : poiMarkerHtml(poi, selected)

      const existing = markersRef.current.get(poi.poi_id)
      if (existing) {
        // Skip setIcon() when nothing about this marker actually changed —
        // without this, selecting a POI re-renders every marker's icon HTML
        // (hundreds in dense districts), which is what caused the jank.
        if (existing.content !== content) {
          existing.marker.setIcon({
            content,
            size:   new window.naver.maps.Size(24, 24),
            anchor: new window.naver.maps.Point(12, 12),
          })
          existing.content = content
        }
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
      markersRef.current.set(poi.poi_id, { marker, content })
    })

    // Cluster bubbles — only rebuilt when the grouping itself changed (e.g.
    // new bbox/zoom). A selection change alone never touches cluster
    // membership, so skip the full teardown/recreate in that case — with
    // hundreds of POIs in dense districts, doing this unconditionally on
    // every render was the other source of the selection-click jank.
    const clusterSig = clusterGroups
      .map(members => members.map(p => p.poi_id).sort().join(','))
      .sort()
      .join('|')
    if (clusterSig !== lastClusterSigRef.current) {
      lastClusterSigRef.current = clusterSig
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
    }
  }, [mapReady, pois, selectedPoiId, planStopIds, onPoiSelect, zoom, savedFolderPoiIds])

  // Pan to the selected POI whenever selection changes externally (e.g. LeftPanel card click) —
  // marker click already pans itself, this covers every other selection source.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps || !selectedPoiId) return
    const poi = pois.find(p => p.poi_id === selectedPoiId)
    if (poi) mapRef.current.panTo(new window.naver.maps.LatLng(poi.coords_lat, poi.coords_lng))
  }, [selectedPoiId, mapReady, pois])

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
          strokeColor:   MAP_PIN_HEX,
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
      strokeColor:    MAP_PIN_HEX,
      strokeOpacity:  0.85,
      strokeWeight:   3,
      strokeStyle:    'solid',
      map:            mapRef.current,
    })
  }, [mapReady, planStopIds, pois, routeLegs])

  // Fit the viewport to the plan route once per load — covers "saved plan
  // shows somewhere random" (map was defaulting to the fixed Seoul center/
  // zoom regardless of where the plan's stops actually are). Fires once when
  // stops first populate (routeLegs for a saved itinerary, planStopIds for
  // the live builder) and re-arms when they clear back to empty, so it
  // doesn't fight the user's own pan/zoom while they keep adding stops.
  const hasFitRouteRef = useRef(false)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps) return

    const points: Array<{ lat: number; lng: number }> = routeLegs && routeLegs.length > 0
      ? routeLegs.flatMap(leg => leg.path)
      : planStopIds
          .map(id => pois.find(p => p.poi_id === id))
          .filter((p): p is MapPoi => !!p)
          .map(p => ({ lat: p.coords_lat, lng: p.coords_lng }))

    if (points.length === 0) {
      hasFitRouteRef.current = false
      return
    }
    if (hasFitRouteRef.current) return
    hasFitRouteRef.current = true

    if (points.length === 1) {
      mapRef.current.setCenter(new window.naver.maps.LatLng(points[0].lat, points[0].lng))
      mapRef.current.setZoom(15)
      return
    }

    const bounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(points[0].lat, points[0].lng),
      new window.naver.maps.LatLng(points[0].lat, points[0].lng),
    )
    points.forEach(p => bounds.extend(new window.naver.maps.LatLng(p.lat, p.lng)))
    mapRef.current.fitBounds(bounds)
  }, [mapReady, routeLegs, planStopIds, pois])

  useEffect(() => () => {
    markersRef.current.forEach(({ marker }) => marker.setMap(null))
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(m => m.setMap(null))
    clusterMarkersRef.current = []
    polylineRef.current?.setMap(null)
    routeLegPolylinesRef.current.forEach(pl => pl.setMap(null))
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
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
            <button onClick={() => setScriptErr(false)} className="text-lav-map text-sm hover:underline min-h-touch flex items-center">
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls — MP_07, MP_08 — desktop only */}
      {mapReady && (
        <div className="hidden lg:flex absolute bottom-sp-8 right-sp-4 flex-col z-10" style={{ filter: 'drop-shadow(0 2px 4px var(--backdrop-50))' }}>
          <button onClick={zoomIn} aria-label={t('zoomIn')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-none hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--lav-map-dim)' }}>
            <Plus size={16} strokeWidth={2} />
          </button>
          <button onClick={zoomOut} aria-label={t('zoomOut')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-none hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--lav-map-dim)', borderTop: 'none' }}>
            <Minus size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Desktop AI open button — MP_30 — hidden, AI assistant not ready for launch */}

      {/* AI Pill — MP_06 */}
      {showAiPill && mapReady && (
        <div className="absolute bottom-sp-8 right-[calc(var(--touch-min)+var(--sp-5))] z-10 flex items-center gap-sp-2 h-touch px-sp-3 bg-bg-2 rounded-full" style={{ border: '1px solid var(--lav-map-mid)' }}>
          <Sparkles size={14} strokeWidth={2} className="text-lav-map shrink-0" aria-hidden="true" />
          <button onClick={onAiPillExpand} className="text-sm text-fg hover:text-lav-map transition-colors whitespace-nowrap" aria-label={t('aiPill.expand')}>
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
