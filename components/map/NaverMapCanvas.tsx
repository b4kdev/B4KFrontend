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
  onPoiSelect:   (id: string | null) => void
  showAiPill:    boolean
  onAiPillDismiss: () => void
  onAiPillExpand:  () => void
  aiOverlayOpen:   boolean
  onAiOpen:        () => void
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
  pois, selectedPoiId, planStopIds, onPoiSelect,
  showAiPill, onAiPillDismiss, onAiPillExpand,
  aiOverlayOpen, onAiOpen,
}: Props) {
  const t = useTranslations('map')
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef       = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef   = useRef<Map<string, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef  = useRef<any>(null)
  const [mapReady, setMapReady]   = useState(false)
  const [scriptErr, setScriptErr] = useState(false)
  const [zoom, setZoom]           = useState(12)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterMarkersRef = useRef<any[]>([])
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

  function initMap() {
    if (!containerRef.current || !window.naver?.maps) return
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
    const clusterActive = zoom <= CLUSTER_ZOOM_THRESHOLD

    const planPois = pois.filter(p => planStopIds.includes(p.place_id))
    const freePois = pois.filter(p => !planStopIds.includes(p.place_id))

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
          members.forEach(m => clusteredIds.add(m.place_id))
        }
      })
    }

    const individualPois = [...planPois, ...freePois.filter(p => !clusteredIds.has(p.place_id))]
    const liveIds = new Set(individualPois.map(p => p.place_id))

    markersRef.current.forEach((marker, id) => {
      if (!liveIds.has(id)) { marker.setMap(null); markersRef.current.delete(id) }
    })

    individualPois.forEach(poi => {
      const selected   = poi.place_id === selectedPoiId
      const planIndex  = planStopIds.indexOf(poi.place_id)
      const isInPlan   = planIndex !== -1
      const content    = isInPlan
        ? planMarkerHtml(planIndex, selected)
        : poiMarkerHtml(poi, selected)

      if (markersRef.current.has(poi.place_id)) {
        markersRef.current.get(poi.place_id)!.setIcon({
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

      window.naver.maps.Event.addListener(marker, 'click', () => onPoiSelect(poi.place_id))
      markersRef.current.set(poi.place_id, marker)
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
  }, [mapReady, pois, selectedPoiId, planStopIds, onPoiSelect, zoom])

  // MP_20 — Route polyline connecting plan stops
  useEffect(() => {
    if (!mapReady || !window.naver?.maps) return
    polylineRef.current?.setMap(null)
    polylineRef.current = null

    if (planStopIds.length < 2) return

    const coords = planStopIds
      .map(id => pois.find(p => p.place_id === id))
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
  }, [mapReady, planStopIds, pois])

  useEffect(() => () => {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current.clear()
    clusterMarkersRef.current.forEach(m => m.setMap(null))
    clusterMarkersRef.current = []
    polylineRef.current?.setMap(null)
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
        className="w-full h-full"
        role="application"
        aria-label={t('ariaLabel')}
      />

      {/* Loading state */}
      {!mapReady && !scriptErr && (
        <div className="absolute inset-0 bg-bg-3 flex flex-col items-center justify-center gap-sp-3">
          <span className="w-8 h-8 border-2 border-lav border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <p className="text-muted text-sm">{t('loading')}</p>
        </div>
      )}

      {/* Error state */}
      {scriptErr && (
        <div className="absolute inset-0 bg-bg-3 flex flex-col items-center justify-center gap-sp-3 text-center px-sp-6">
          <p className="text-fg text-sm">{t('error')}</p>
          <button onClick={() => setScriptErr(false)} className="text-lav text-sm hover:underline min-h-touch flex items-center">
            {t('retry')}
          </button>
        </div>
      )}

      {/* Zoom controls — MP_07, MP_08 — desktop only */}
      {mapReady && (
        <div className="hidden lg:flex absolute bottom-sp-8 right-sp-4 flex-col z-10" style={{ filter: 'drop-shadow(0 2px 4px var(--backdrop-50))' }}>
          <button onClick={zoomIn} aria-label={t('zoomIn')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-t-lg hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--bdr)' }}>
            <Plus size={16} strokeWidth={2} />
          </button>
          <button onClick={zoomOut} aria-label={t('zoomOut')} className="w-touch h-touch flex items-center justify-center bg-bg-2 text-fg rounded-b-lg hover:bg-bg-3 transition-colors" style={{ border: '1px solid var(--bdr)', borderTop: 'none' }}>
            <Minus size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Desktop AI open button — MP_30, hidden when overlay open */}
      {mapReady && !aiOverlayOpen && (
        <button
          onClick={onAiOpen}
          aria-label={t('aiOverlay.openButton')}
          className="hidden lg:flex absolute bottom-sp-8 right-[calc(var(--touch-min)+var(--sp-5))] z-10 items-center gap-sp-2 h-touch px-sp-3 bg-bg-2 rounded-full transition-colors hover:bg-bg-3"
          style={{ border: '1px solid var(--lav-border)' }}
        >
          <Sparkles size={14} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
          <span className="text-sm text-fg whitespace-nowrap">{t('aiOverlay.openButton')}</span>
        </button>
      )}

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
