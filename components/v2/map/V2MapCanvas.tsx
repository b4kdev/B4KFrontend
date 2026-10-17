'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- the Naver Maps SDK ships without types (as in components/map/NaverMapCanvas.tsx) */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Script from 'next/script'
import { renderToStaticMarkup } from 'react-dom/server'
import { Clapperboard, Landmark, MapPin, Music, Sparkles, Utensils } from 'lucide-react'
import type { MapBounds, MapPoi } from '@/hooks/useMapPois'
import { TOKEN_HEX } from '@/tokens/colors'

// Map canvas of the preview (UI-74, UI-39, UI-78; PD-02): the Naver map with the new markers.
// Map pin = round map/pin-fill with a map/pin-stroke ring and the K-domain icon; Selected =
// map/pin-selected at map/pin-size-selected; clusters below street zoom; plan stops as Stop
// badges in plan/day-N; the route as a straight line per day in the day color (the SDK needs
// hex: tokens/colors.ts). Markers are DOM, so they read the token CSS variables directly.
// Zoom buttons are the library Zoom control (outside), so the SDK controls are off.

export type PlanStopOnMap = { poi: MapPoi; day: number; order: number }
export type V2MapHandle = { zoomIn: () => void; zoomOut: () => void; panTo: (lat: number, lng: number) => void }

type Props = {
  pois: MapPoi[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  planStops?: PlanStopOnMap[]
  activeDay?: number | 'all'
  /** Saved plans: real road paths per leg; otherwise straight lines per day. */
  routeLegs?: { day: number; path: { lat: number; lng: number }[] }[]
  onBounds?: (b: MapBounds, zoom: number) => void
  onZoom?: (zoom: number) => void
  center?: { lat: number; lng: number }
  label: string
  errorText: string
}

const SEOUL = { lat: 37.5665, lng: 126.978 }
const CLUSTER_BELOW = 15

// window.naver and window.navermap_authFailure are declared in components/map/NaverMapCanvas.tsx.

const ICONS: Record<string, string> = {}
const iconFor = (domain?: string | null) => {
  const key = domain ?? 'generic'
  if (!ICONS[key]) {
    const C = key === 'k-pop' ? Music : key === 'k-drama' ? Clapperboard : key === 'k-beauty' ? Sparkles : key === 'k-food' ? Utensils : key === 'k-culture' ? Landmark : MapPin
    ICONS[key] = renderToStaticMarkup(<C size={14} strokeWidth={2} aria-hidden />)
  }
  return ICONS[key]
}

const HIT = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer'
const pinHtml = (p: MapPoi, selected: boolean) =>
  `<div style="${HIT}" role="img" aria-label="${(p.name_preferred ?? p.name_en ?? p.name_ko).replace(/"/g, '')}"><span style="width:var(${selected ? '--map-pin-size-selected' : '--map-pin-size'});height:var(${selected ? '--map-pin-size-selected' : '--map-pin-size'});border-radius:9999px;background:var(${selected ? '--map-pin-selected' : '--map-pin-fill'});border:var(--border-width-2) solid var(--map-pin-stroke);display:flex;align-items:center;justify-content:center;color:var(--color-fg-on-media);transition:all var(--duration-short4) var(--easing-standard)">${iconFor(p.display_domain)}</span></div>`
const clusterHtml = (n: number) => {
  const size = n < 10 ? '--map-cluster-size-sm' : n < 50 ? '--map-cluster-size-md' : '--map-cluster-size-lg'
  return `<div style="${HIT};width:52px;height:52px"><span style="width:var(${size});height:var(${size});border-radius:9999px;background:var(--map-pin-fill);border:var(--border-width-2) solid var(--map-pin-stroke);display:flex;align-items:center;justify-content:center;color:var(--color-fg-on-media);font:var(--font-weight-semibold) var(--font-size-xs)/1 var(--font-family-body)">${n}</span></div>`
}
const stopHtml = (order: number, day: number, selected: boolean) =>
  `<div style="${HIT}"><span style="width:var(--stop-badge-size-md);height:var(--stop-badge-size-md);border-radius:9999px;background:var(--plan-day-${day});color:var(--plan-day-${day}-fg);display:flex;align-items:center;justify-content:center;font:var(--font-weight-bold) var(--font-size-2xs)/1 var(--font-family-body);${selected ? 'outline:var(--border-width-2) solid var(--map-pin-selected);outline-offset:2px' : ''}">${order}</span></div>`

function boundsOf(map: any): MapBounds {
  const b = map.getBounds()
  const sw = b.getSW()
  const ne = b.getNE()
  return { minLat: sw.lat(), maxLat: ne.lat(), minLng: sw.lng(), maxLng: ne.lng() }
}

export const V2MapCanvas = forwardRef<V2MapHandle, Props>(function V2MapCanvas(
  { pois, selectedId, onSelect, planStops = [], activeDay = 'all', routeLegs, onBounds, onZoom, center, label, errorText },
  ref,
) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const overlays = useRef<any[]>([])
  const lines = useRef<any[]>([])
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.naver?.maps)
  const [zoom, setZoom] = useState(13)
  const [failed, setFailed] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const select = useRef(onSelect)
  select.current = onSelect

  useImperativeHandle(ref, () => ({
    zoomIn: () => map.current?.setZoom(map.current.getZoom() + 1, true),
    zoomOut: () => map.current?.setZoom(map.current.getZoom() - 1, true),
    panTo: (lat, lng) => map.current?.panTo(new window.naver.maps.LatLng(lat, lng)),
  }))

  useEffect(() => {
    window.navermap_authFailure = () => setFailed(true)
  }, [])

  // A canvas that remounts while the SDK is still loading (phone/desktop switch) gets no onReady
  // from the deduped Script, so it watches for the SDK itself.
  useEffect(() => {
    if (ready) return
    const t = window.setInterval(() => {
      if (window.naver?.maps) setReady(true)
    }, 200)
    return () => window.clearInterval(t)
  }, [ready])

  // Create the map once the SDK is there.
  useEffect(() => {
    if (!ready || !el.current || map.current) return
    const N = window.naver.maps
    const c = center ?? SEOUL
    map.current = new N.Map(el.current, {
      center: new N.LatLng(c.lat, c.lng),
      zoom: 13,
      zoomControl: false,
      mapDataControl: false,
      scaleControl: false,
      logoControlOptions: { position: N.Position.BOTTOM_LEFT },
    })
    const idle = () => {
      const z = map.current.getZoom()
      setZoom(z)
      onZoom?.(z)
      onBounds?.(boundsOf(map.current), z)
    }
    N.Event.addListener(map.current, 'idle', idle)
    N.Event.addListener(map.current, 'click', () => select.current(null))
    idle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Pan to a new center (place from a card, plan load).
  useEffect(() => {
    if (map.current && center) map.current.panTo(new window.naver.maps.LatLng(center.lat, center.lng))
  }, [center?.lat, center?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // Markers.
  useEffect(() => {
    if (!map.current) return
    const N = window.naver.maps
    overlays.current.forEach((m) => m.setMap(null))
    overlays.current = []
    const inPlan = new Set(planStops.map((s) => s.poi.poi_id))
    const free = pois.filter((p) => !inPlan.has(p.poi_id))
    const add = (lat: number, lng: number, html: string, size: number, onClick: () => void, z = 1) => {
      const m = new N.Marker({ position: new N.LatLng(lat, lng), map: map.current, icon: { content: html, anchor: new N.Point(size / 2, size / 2) }, zIndex: z })
      N.Event.addListener(m, 'click', (e: any) => {
        e?.domEvent?.stopPropagation?.()
        onClick()
      })
      overlays.current.push(m)
    }
    if (zoom < CLUSTER_BELOW && free.length > 40) {
      const grid = zoom <= 10 ? 0.08 : zoom <= 12 ? 0.03 : 0.012
      const buckets = new Map<string, MapPoi[]>()
      for (const p of free) {
        const key = `${Math.floor(p.coords_lat / grid)}:${Math.floor(p.coords_lng / grid)}`
        buckets.set(key, [...(buckets.get(key) ?? []), p])
      }
      buckets.forEach((members) => {
        if (members.length === 1) {
          const p = members[0]
          add(p.coords_lat, p.coords_lng, pinHtml(p, p.poi_id === selectedId), 44, () => select.current(p.poi_id), p.poi_id === selectedId ? 50 : 1)
          return
        }
        const lat = members.reduce((s, p) => s + p.coords_lat, 0) / members.length
        const lng = members.reduce((s, p) => s + p.coords_lng, 0) / members.length
        add(lat, lng, clusterHtml(members.length), 52, () => map.current.morph(new N.LatLng(lat, lng), Math.min(zoom + 2, 18)), 5)
      })
    } else {
      for (const p of free) add(p.coords_lat, p.coords_lng, pinHtml(p, p.poi_id === selectedId), 44, () => select.current(p.poi_id), p.poi_id === selectedId ? 50 : 1)
    }
    for (const s of planStops) {
      if (activeDay !== 'all' && s.day !== activeDay) continue
      add(s.poi.coords_lat, s.poi.coords_lng, stopHtml(s.order, s.day, s.poi.poi_id === selectedId), 44, () => select.current(s.poi.poi_id), 40)
    }
  }, [pois, planStops, selectedId, zoom, activeDay, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Route lines in the day colors.
  useEffect(() => {
    if (!map.current) return
    const N = window.naver.maps
    lines.current.forEach((l) => l.setMap(null))
    lines.current = []
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const color = (day: number) => TOKEN_HEX[theme].planDays[Math.min(Math.max(day, 1), 8) - 1].fill
    const paths = routeLegs
      ? routeLegs.filter((l) => activeDay === 'all' || l.day === activeDay).map((l) => ({ day: l.day, path: l.path }))
      : Array.from(new Set(planStops.map((s) => s.day)))
          .filter((d) => activeDay === 'all' || d === activeDay)
          .map((day) => ({ day, path: planStops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => ({ lat: s.poi.coords_lat, lng: s.poi.coords_lng })) }))
    for (const p of paths) {
      if (p.path.length < 2) continue
      lines.current.push(new N.Polyline({ map: map.current, path: p.path.map((x) => new N.LatLng(x.lat, x.lng)), strokeColor: color(p.day), strokeWeight: 4, strokeOpacity: 0.9 }))
    }
  }, [planStops, routeLegs, activeDay, ready])

  return (
    <div className="relative size-full bg-ui-bg-sunken">
      {clientId ? (
        <Script src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`} strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      ) : null}
      <div ref={el} role="application" aria-label={label} className="size-full" />
      {failed || !clientId ? (
        <p role="alert" className="absolute inset-0 flex items-center justify-center p-[var(--space-6)] text-center type-body-base text-ui-fg-muted">{errorText}</p>
      ) : null}
    </div>
  )
})
