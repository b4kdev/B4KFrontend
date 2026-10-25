'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- the Naver Maps SDK ships without types (as in components/map/NaverMapCanvas.tsx) */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Script from 'next/script'
import type { MapBounds, MapPoi } from '@/hooks/useMapPois'
import { TOKEN_HEX } from '@/tokens/colors'

// Map canvas: the Naver map with the B4K markers. Map pin = the place photo in a circle with a
// tail, no icon, by zoom tier: zoom 15 a dot, zoom 16 a small photo pin, zoom 17 and closer the
// photo pin with the name below where it does not overlap another name. The selected place is the
// large photo pin with a map/pin-selected ring and its name at every zoom, drawn on top. Below
// zoom 15 places cluster on a 60 px screen grid; a cluster tap fits its places (zoom 17 at most).
// Colors are monochrome and inverse to the map (map/pin-fill and map/pin-stroke). Plan stops are
// Stop badges in plan/day-N, never clustered; the route is a line per day in the day color (the
// SDK needs hex: tokens/colors.ts). Markers are DOM, so they read the token CSS variables.
// Zoom buttons are the library Zoom control (outside), so the SDK controls are off.

export type PlanStopOnMap = { poi: MapPoi; day: number; order: number }
export type V2MapHandle = {
  zoomIn: () => void
  zoomOut: () => void
  panTo: (lat: number, lng: number) => void
  /** A picked place: zoom 16 or closer, centred in the map left visible above `bottom` px (a phone sheet). */
  focus: (lat: number, lng: number, bottom?: number) => void
  fitTo: (points: { lat: number; lng: number }[]) => void
}

type Props = {
  pois: MapPoi[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  planStops?: PlanStopOnMap[]
  activeDay?: number | 'all'
  /** Places the viewer saved: their pins sit above other places. */
  savedIds?: Set<string>
  /** Saved plans: real road paths per leg; otherwise straight lines per day. */
  routeLegs?: { day: number; path: { lat: number; lng: number }[] }[]
  onBounds?: (b: MapBounds, zoom: number) => void
  onZoom?: (zoom: number) => void
  center?: { lat: number; lng: number }
  /** Published plan: zoom to show every stop once they load. */
  fitStops?: boolean
  /** Extra space kept clear when fitting stops, e.g. the phone sheet over the map's lower part (px). */
  fitBottom?: number
  /** The visitor's location from Locate me: the location dot (not a button). */
  userLocation?: { lat: number; lng: number } | null
  label: string
  errorText: string
}

const SEOUL = { lat: 37.5665, lng: 126.978 }
const CLUSTER_BELOW = 15
const CLUSTER_GRID_PX = 60
// Overlap order, top first: selected, plan stops, saved, clusters, other places. Within a layer,
// more saves sit higher, then the pin lower on screen.
const Z_LAYER = 100000
const Z = { other: 1, cluster: 2, saved: 3, stop: 4, selected: 5 }
// The Naver tiles are light in both themes until the dark map style exists, so the pins use the
// light-map colors (dark pins). Set to 'dark' with the dark map style.
const MAP_TONE: 'light' | 'dark' = 'light'

// window.naver and window.navermap_authFailure are declared in components/map/NaverMapCanvas.tsx.

const HIT = 'width:var(--target-touch-min);height:var(--target-touch-min);display:flex;align-items:center;justify-content:center;cursor:pointer'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// Remote photos go through the Next image proxy: the page only loads images from its own origin.
// Pin photos through the image optimizer at the pin's file size (56 selected at 2x).
const pinSrc = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=112&q=75`
const poiLabel = (p: MapPoi) => esc(p.name_preferred ?? p.name_en ?? p.name_ko)
// Pins and plan stops are buttons (Tab reaches them, Enter or Space selects); the focus ring is in
// globals.css (.b4k-map-marker). Clusters stay pointer-only: zoom in with the Zoom control instead.
const markerAttrs = (id: string, label: string, selected: boolean) =>
  `class="b4k-map-marker" role="button" tabindex="0" data-poi-id="${esc(id)}" aria-pressed="${selected}" aria-label="${label}"`
type PinTier = 'dot' | 'small' | 'large' | 'selected'
const tierFor = (zoom: number, selected: boolean): PinTier => (selected ? 'selected' : zoom >= 17 ? 'large' : zoom >= 16 ? 'small' : 'dot')
const PIN_SIZE: Record<Exclude<PinTier, 'dot'>, string> = { small: '--map-pin-size-sm', large: '--map-pin-size', selected: '--map-pin-size-selected' }
const PIN_PX: Record<PinTier, number> = { dot: 12, small: 32, large: 40, selected: 56 }
const TAIL_PX = 6
const LABEL = 'margin-top:var(--space-0-5);max-width:120px;padding:0 var(--space-1);border-radius:var(--radius-full);background:var(--map-pin-stroke);color:var(--map-pin-fill);font:var(--font-weight-semibold) var(--font-size-xs)/var(--leading-tight) var(--font-family-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
const pinHtml = (p: MapPoi, tier: PinTier, showName: boolean) => {
  const selected = tier === 'selected'
  if (tier === 'dot') {
    return `<div style="${HIT}" ${markerAttrs(p.poi_id, poiLabel(p), false)}><span style="width:var(--map-pin-dot-size);height:var(--map-pin-dot-size);border-radius:var(--radius-full);background:var(--map-pin-fill);border:var(--border-width-2) solid var(--map-pin-stroke)"></span></div>`
  }
  const size = `var(${PIN_SIZE[tier]})`
  const ring = selected ? 'var(--border-width-3) solid var(--map-pin-selected)' : 'var(--border-width-2) solid var(--map-pin-fill)'
  const tail = selected ? 'var(--map-pin-selected)' : 'var(--map-pin-fill)'
  const photo = p.primary_image_url ? `background:var(--map-pin-stroke) url('${esc(pinSrc(p.primary_image_url))}') center/cover no-repeat` : 'background:var(--map-pin-fill)'
  const name = showName || selected ? `<span style="${LABEL}">${poiLabel(p)}</span>` : ''
  // Fixed width so the anchor (half of it) stays on the place; a wider name overflows evenly on both sides.
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;width:${Math.max(44, PIN_PX[tier])}px" ${markerAttrs(p.poi_id, poiLabel(p), selected)}><span style="box-sizing:border-box;width:${size};height:${size};border-radius:var(--radius-full);border:${ring};${photo};transition:all var(--duration-short4) var(--easing-standard)"></span><span aria-hidden style="width:0;height:0;border-left:${TAIL_PX}px solid transparent;border-right:${TAIL_PX}px solid transparent;border-top:${TAIL_PX}px solid ${tail}"></span>${name}</div>`
}
const clusterHtml = (n: number) => {
  const size = n < 10 ? '--map-cluster-size-sm' : n < 50 ? '--map-cluster-size-md' : '--map-cluster-size-lg'
  return `<div style="${HIT};width:52px;height:52px"><span style="width:var(${size});height:var(${size});border-radius:var(--radius-full);background:var(--map-pin-fill);border:var(--border-width-2) solid var(--map-pin-stroke);display:flex;align-items:center;justify-content:center;color:var(--color-fg-on-media);font:var(--font-weight-semibold) var(--font-size-xs)/var(--leading-tight) var(--font-family-body);letter-spacing:var(--tracking-wider)">${n}</span></div>`
}
const stopHtml = (p: MapPoi, order: number, day: number, selected: boolean) =>
  `<div style="${HIT}" ${markerAttrs(p.poi_id, `${order}. ${poiLabel(p)}`, selected)}><span style="width:var(--stop-badge-size-md);height:var(--stop-badge-size-md);border-radius:var(--radius-full);background:var(--plan-day-${day});color:var(--plan-day-${day}-fg);display:flex;align-items:center;justify-content:center;font:var(--font-weight-semibold) var(--font-size-xs)/var(--leading-tight) var(--font-family-body);letter-spacing:var(--tracking-wider)">${order}</span></div>`

function boundsOf(map: any): MapBounds {
  const b = map.getBounds()
  const sw = b.getSW()
  const ne = b.getNE()
  return { minLat: sw.lat(), maxLat: ne.lat(), minLng: sw.lng(), maxLng: ne.lng() }
}

// The SDK tears itself down (window.naver.maps and its internals set to null) when its key check
// fails, or when a second map is made while the first check is still open; any call on a map made
// before that throws. Every map call goes through live().
const sdkAlive = () => typeof window !== 'undefined' && !!window.naver?.maps

export const V2MapCanvas = forwardRef<V2MapHandle, Props>(function V2MapCanvas(
  { pois, selectedId, onSelect, planStops = [], activeDay = 'all', savedIds, routeLegs, onBounds, onZoom, center, fitStops, fitBottom = 0, userLocation, label, errorText },
  ref,
) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const overlays = useRef<any[]>([])
  const lines = useRef<any[]>([])
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.naver?.maps)
  // The SDK can hand back a map before its projection exists (a second load in the same tab);
  // pins and fits wait for the map's init (or first idle) event.
  const [mapReady, setMapReady] = useState(false)
  const [zoom, setZoom] = useState(13)
  const [failed, setFailed] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const select = useRef(onSelect)
  select.current = onSelect
  // The pin that last had the keyboard focus. A redraw can drop it for a moment (focus falls to the
  // page body), so it is kept until the focus moves somewhere else, and given back when the pin returns.
  const focusedPin = useRef<string | null>(null)
  useEffect(() => {
    const onFocus = (e: Event) => {
      focusedPin.current = (e.target as HTMLElement | null)?.closest?.('[data-poi-id]')?.getAttribute('data-poi-id') ?? null
    }
    // A click anywhere also ends it, so a pointer user's later redraw never pulls the focus back.
    document.addEventListener('focusin', onFocus)
    document.addEventListener('pointerdown', onFocus)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('pointerdown', onFocus)
    }
  }, [])
  const pendingFit = useRef<{ lat: number; lng: number }[] | null>(null)
  const live = () => (map.current && sdkAlive() ? map.current : null)

  const fitPoints = (points: { lat: number; lng: number }[]) => {
    if (!live() || !points.length) return
    const N = window.naver.maps
    if (points.length === 1) return map.current.setCenter(new N.LatLng(points[0].lat, points[0].lng))
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    map.current.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...lats), Math.min(...lngs)), new N.LatLng(Math.max(...lats), Math.max(...lngs))), { top: 80, right: 80, bottom: 80 + fitBottom, left: 80 })
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => live()?.setZoom(map.current.getZoom() + 1, true),
    zoomOut: () => live()?.setZoom(map.current.getZoom() - 1, true),
    panTo: (lat, lng) => live()?.panTo(new window.naver.maps.LatLng(lat, lng)),
    focus: (lat, lng, bottom = 0) => {
      const m = live()
      if (!m) return
      const N = window.naver.maps
      if (m.getZoom() < 16) m.setZoom(16, false)
      const at = new N.LatLng(lat, lng)
      const proj = mapReady ? m.getProjection() : null
      if (!proj || !bottom) return m.panTo(at)
      // The visible centre sits bottom/2 above the canvas centre: aim the canvas centre that far below the place.
      const o = proj.fromCoordToOffset(at)
      m.panTo(proj.fromOffsetToCoord(new N.Point(o.x, o.y + bottom / 2)))
    },
    fitTo: (points) => {
      // Before the SDK is up (a hand-off on first load) the fit waits for the map.
      if (!live() || !mapReady) pendingFit.current = points
      else fitPoints(points)
    },
  }))

  useEffect(() => {
    window.navermap_authFailure = () => {
      map.current = null
      setFailed(true)
    }
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
    if (!ready || !el.current || map.current || !sdkAlive()) return
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
      // The SDK can still fire events on a map it has torn down.
      if (!live()) return
      const z = map.current.getZoom()
      setZoom(z)
      onZoom?.(z)
      onBounds?.(boundsOf(map.current), z)
    }
    N.Event.addListener(map.current, 'idle', () => {
      setMapReady(true)
      idle()
    })
    N.Event.once(map.current, 'init', () => setMapReady(true))
    N.Event.addListener(map.current, 'click', () => select.current(null))
    // Keyboard on a focused pin or stop: Enter or Space selects it.
    el.current.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const id = (e.target as HTMLElement | null)?.closest?.('[data-poi-id]')?.getAttribute('data-poi-id')
      if (!id) return
      e.preventDefault()
      e.stopPropagation()
      select.current(id)
    })
    idle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // A fit asked for before the map was ready runs once it is.
  useEffect(() => {
    if (!mapReady || !pendingFit.current) return
    fitPoints(pendingFit.current)
    pendingFit.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // Pan to a new center (place from a card, plan load).
  useEffect(() => {
    if (live() && center) map.current.panTo(new window.naver.maps.LatLng(center.lat, center.lng))
  }, [center?.lat, center?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fit the plan's stops.
  useEffect(() => {
    if (!live() || !mapReady || !fitStops || planStops.length < 2) return
    const N = window.naver.maps
    const lats = planStops.map((s) => s.poi.coords_lat)
    const lngs = planStops.map((s) => s.poi.coords_lng)
    map.current.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...lats), Math.min(...lngs)), new N.LatLng(Math.max(...lats), Math.max(...lngs))), { top: 80, right: 80, bottom: 80 + fitBottom, left: 80 })
  }, [fitStops, planStops, mapReady, fitBottom])

  // Location dot: 16 dot with a 2 px ring on a 40 accuracy halo, above the place pins (below a
  // selected one); taps go through it to the pins. Colors follow MAP_TONE like the pins.
  useEffect(() => {
    if (!live() || !mapReady || !userLocation) return
    const N = window.naver.maps
    const html = `<div aria-hidden style="pointer-events:none;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-full);background:color-mix(in srgb, var(--map-pin-fill) 16%, transparent)"><span style="box-sizing:border-box;width:16px;height:16px;border-radius:var(--radius-full);background:var(--map-pin-fill);border:var(--border-width-2) solid var(--map-pin-stroke)"></span></div>`
    const dot = new N.Marker({ map: map.current, position: new N.LatLng(userLocation.lat, userLocation.lng), icon: { content: html, anchor: new N.Point(20, 20) }, clickable: false, zIndex: Z_LAYER * Z.selected - 1 })
    return () => dot.setMap(null)
  }, [mapReady, userLocation?.lat, userLocation?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // Markers.
  useEffect(() => {
    if (!live() || !mapReady) return
    const N = window.naver.maps
    // Markers are rebuilt on every change; a pin that had the keyboard focus gets it back.
    const active = document.activeElement
    const focusedId = !active || active === document.body ? focusedPin.current : active.closest?.('[data-poi-id]')?.getAttribute('data-poi-id')
    overlays.current.forEach((m) => m.setMap(null))
    overlays.current = []
    const inPlan = new Set(planStops.map((s) => s.poi.poi_id))
    const free = pois.filter((p) => !inPlan.has(p.poi_id))
    const add = (lat: number, lng: number, html: string, anchor: { x: number; y: number }, onClick: () => void, z = 1) => {
      const m = new N.Marker({ position: new N.LatLng(lat, lng), map: map.current, icon: { content: html, anchor: new N.Point(anchor.x, anchor.y) }, zIndex: z })
      N.Event.addListener(m, 'click', (e: any) => {
        e?.domEvent?.stopPropagation?.()
        onClick()
      })
      overlays.current.push(m)
    }
    const proj = map.current.getProjection()
    const px = (p: { coords_lat: number; coords_lng: number }) => proj.fromCoordToOffset(new N.LatLng(p.coords_lat, p.coords_lng))
    // Photo pins hang from the tail tip; dots and badges sit on their center.
    const anchorFor = (tier: PinTier) => (tier === 'dot' ? { x: 22, y: 22 } : { x: Math.max(44, PIN_PX[tier]) / 2, y: PIN_PX[tier] + TAIL_PX })
    // Names show at zoom 17 and closer where they do not overlap a name already placed.
    const taken: { x: number; y: number }[] = []
    const nameFits = (p: MapPoi) => {
      const o = px(p)
      if (taken.some((t) => Math.abs(t.x - o.x) < 120 && Math.abs(t.y - o.y) < 56)) return false
      taken.push({ x: o.x, y: o.y })
      return true
    }
    const rank = new Map(
      free
        .map((p) => ({ id: p.poi_id, saves: p.save_count ?? 0, y: px(p).y }))
        .sort((a, b) => a.saves - b.saves || a.y - b.y)
        .map((p, i) => [p.id, i + 1]),
    )
    const addPin = (p: MapPoi) => {
      const selected = p.poi_id === selectedId
      const tier = tierFor(zoom, selected)
      const showName = tier === 'large' && nameFits(p)
      const layer = selected ? Z.selected : savedIds?.has(p.poi_id) ? Z.saved : Z.other
      add(p.coords_lat, p.coords_lng, pinHtml(p, tier, showName), anchorFor(tier), () => select.current(p.poi_id), layer * Z_LAYER + (rank.get(p.poi_id) ?? 0))
    }
    const sel = free.find((p) => p.poi_id === selectedId)
    if (sel && zoom >= 17) taken.push({ x: px(sel).x, y: px(sel).y })
    // Names go to saved places first, then to the most saved: they claim their spot before the rest.
    const isSaved = (p: MapPoi) => (savedIds?.has(p.poi_id) ? 1 : 0)
    const rest = free.filter((p) => p !== sel).sort((a, b) => isSaved(b) - isSaved(a) || (b.save_count ?? 0) - (a.save_count ?? 0))
    if (zoom < CLUSTER_BELOW) {
      const buckets = new Map<string, MapPoi[]>()
      for (const p of rest) {
        const o = px(p)
        const key = `${Math.floor(o.x / CLUSTER_GRID_PX)}:${Math.floor(o.y / CLUSTER_GRID_PX)}`
        buckets.set(key, [...(buckets.get(key) ?? []), p])
      }
      buckets.forEach((members) => {
        if (members.length === 1) return addPin(members[0])
        const lat = members.reduce((sum, p) => sum + p.coords_lat, 0) / members.length
        const lng = members.reduce((sum, p) => sum + p.coords_lng, 0) / members.length
        add(lat, lng, clusterHtml(members.length), { x: 26, y: 26 }, () => {
          fitPoints(members.map((p) => ({ lat: p.coords_lat, lng: p.coords_lng })))
          if (live() && map.current.getZoom() > 17) map.current.setZoom(17, true)
        }, Z.cluster * Z_LAYER)
      })
    } else {
      for (const p of rest) addPin(p)
    }
    if (sel) addPin(sel)
    for (const s of planStops) {
      if (activeDay !== 'all' && s.day !== activeDay) continue
      add(s.poi.coords_lat, s.poi.coords_lng, stopHtml(s.poi, s.order, s.day, s.poi.poi_id === selectedId), { x: 22, y: 22 }, () => select.current(s.poi.poi_id), (s.poi.poi_id === selectedId ? Z.selected : Z.stop) * Z_LAYER)
    }
    if (focusedId) requestAnimationFrame(() => el.current?.querySelector<HTMLElement>(`[data-poi-id="${CSS.escape(focusedId)}"]`)?.focus())
  }, [pois, planStops, selectedId, zoom, activeDay, mapReady, savedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Route lines in the day colors.
  useEffect(() => {
    if (!live()) return
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
    // isolate: the SDK gives its logo and controls a high z-index; keep them under sheets and dialogs.
    <div className="relative isolate size-full bg-ui-bg-sunken">
      {clientId ? (
        <Script src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`} strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      ) : null}
      <div ref={el} role="application" aria-label={label} data-map-tone={MAP_TONE} className="size-full" />
      {failed || !clientId ? (
        <p role="alert" className="absolute inset-0 flex items-center justify-center p-[var(--space-6)] text-center type-body-base text-ui-fg-muted">{errorText}</p>
      ) : null}
    </div>
  )
})
