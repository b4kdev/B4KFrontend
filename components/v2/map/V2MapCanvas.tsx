'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- the Naver Maps SDK ships without types (as in components/map/NaverMapCanvas.tsx) */

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore, type MutableRefObject } from 'react'
import Script from 'next/script'
import { useLocale } from 'next-intl'
import type { MapBounds, MapPoi } from '@/hooks/useMapPois'
import { BedDouble, Coffee, Crown, Flower2, Landmark, ShoppingBag, Trees, Utensils, type LucideIcon } from 'lucide-react'
import { mapKindOf, mapTypeOf, type MapKind } from './mapType'
import { TOKEN_HEX } from '@/tokens/colors'
import { useCd } from '@/components/v2/cd'
import { PLACE_TYPE_ICON, categoryAttr, placeTypeOf } from '@/components/library'
import { keepMapLook } from './mapLook'

// Map canvas: the Naver map with the B4K markers. Map pin = the place photo in a squircle with a
// 3 px ring and a pointer (no photo: the place type's colour with its icon in black), by zoom tier:
// zoom 15 a dot, zoom 16 a small pin, zoom 17 and closer the pin with the name below where it does
// not overlap another name. The selected place is the 48 pin in map/pin-selected with its name at
// every zoom, drawn on top. Below zoom 15 places cluster on a 60 px screen grid; a cluster tap fits
// its places (zoom 17 at most). Pins carry data-category (the place's K domain) when it has one.
// Plan stops are numbered squircles in plan/day-N, never clustered; the route is a line per day in
// the day colour, with a dark casing on light maps (the SDK needs hex: tokens/colors.ts). Markers are DOM, so they read the token CSS variables.
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
  /** A place the page opens on (a link to it): the map is made already centred on it, at the
   *  picked-place zoom, `bottom` px of sheet kept clear, so nothing moves after the first paint. */
  openAt?: { lat: number; lng: number; bottom: number } | null
  /** Wait for `openAt` before making the map (its place is still loading). */
  holdOpen?: boolean
  /** Published plan: zoom to show every stop once they load. */
  fitStops?: boolean
  /** Extra space kept clear when fitting stops, e.g. the phone sheet over the map's lower part (px). */
  fitBottom?: number
  /** Room taken at the top of the map (phones: the floating bars and chips); fitted points stay below it. */
  fitTop?: number
  /** The visitor's location from Locate me: the location dot (not a button). */
  userLocation?: { lat: number; lng: number } | null
  label: string
  errorText: string
}

const SEOUL = { lat: 37.5665, lng: 126.978 }
// The map opens at the small photo pin zoom, so the first view shows place photos, as drawn.
const OPEN_ZOOM = 16
// A picked place shows at this zoom or closer.
const PICK_ZOOM = 16
const CLUSTER_BELOW = 15
const CLUSTER_GRID_PX = 60
// Overlap order, top first: selected, plan stops, saved, clusters, other places. Within a layer,
// more saves sit higher, then the pin lower on screen.
const Z_LAYER = 100000
const Z = { other: 1, cluster: 2, saved: 3, stop: 4, selected: 5 }
/** With one day chosen, the other days' stops and lines stay on the map, faded to this opacity. */
const OTHER_DAY_OPACITY = 0.35
// Custom map style: a My Style ID published in the Naver Style Editor, which only the vector (GL)
// map shows. Unset, the map is the raster map with the Naver tiles. The dark theme uses the dark
// style, or the light one while no dark style is set (as the raster tiles are light in both themes).
const MAP_STYLE = { light: process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_LIGHT ?? '', dark: process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_DARK ?? '' }
const styleFor = (theme: string | undefined) => (theme === 'dark' ? MAP_STYLE.dark || MAP_STYLE.light : MAP_STYLE.light)
// The pins are inverse to the map: dark pins on a light map, light pins only on the dark style.
const toneFor = (styleId: string): 'light' | 'dark' => (styleId && styleId === MAP_STYLE.dark && styleId !== MAP_STYLE.light ? 'dark' : 'light')
// A style loads the SDK's GL module. With it loaded, every map (the vector map and the raster map
// it falls back to) draws zoom z at the raster scale of z + 1; the canvas keeps raster zoom levels
// (pin tiers, clusters, fits) and shifts them at the SDK calls.
const GL_SDK = !!(MAP_STYLE.light || MAP_STYLE.dark)
const ZOOM_SHIFT = GL_SDK ? 1 : 0
// Map labels follow the site language: the name in that language with the Korean name below it.
// NAVER has no Traditional Chinese, so zh-TW gets Simplified Chinese labels; pt-BR gets English.
const NAVER_LANG: Record<string, string> = { ko: 'ko', en: 'en', ja: 'ja', 'zh-TW': 'zh', 'pt-BR': 'en' }
// The SDK's language is fixed when maps.js loads; this is the language of the one loaded.
let sdkLang: string | null = null
// A style the SDK cannot load (a wrong ID, a server error) makes it tear the map down without an
// event: the canvas checks for that this long and then makes the raster map instead.
const GL_WATCH_MS = 20000
// The B4K map look over the style (mapLook.ts): on only when set to 'on', apart from the style IDs.
const RESTYLE = process.env.NEXT_PUBLIC_NAVER_MAP_RESTYLE === 'on'

// window.naver and window.navermap_authFailure are declared in components/map/NaverMapCanvas.tsx.

const HIT = 'width:var(--target-touch-min);height:var(--target-touch-min);display:flex;align-items:center;justify-content:center;cursor:pointer'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// Remote photos go through the Next image proxy: the page only loads images from its own origin.
// Pin photos through the image optimizer at the pin's file size (56 selected at 2x).
const pinSrc = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=112&q=75`
const poiLabel = (p: MapPoi) => esc(p.name_preferred ?? p.name_en ?? p.name_ko)
// Pins and plan stops are buttons (Tab reaches them, Enter or Space selects); the focus ring is in
// globals.css (.b4k-map-marker). Clusters stay pointer-only: zoom in with the Zoom control instead.
const markerAttrs = (id: string, label: string, selected: boolean, category?: string) =>
  `class="b4k-map-marker" role="button" tabindex="0" data-poi-id="${esc(id)}"${category ? ` data-category="${esc(category)}"` : ''} aria-pressed="${selected}" aria-label="${label}"`
type PinTier = 'dot' | 'small' | 'large' | 'selected'
const tierFor = (zoom: number, selected: boolean): PinTier => (selected ? 'selected' : zoom >= 17 ? 'large' : zoom >= 16 ? 'small' : 'dot')
const PIN_SIZE: Record<Exclude<PinTier, 'dot'>, string> = { small: '--map-pin-size-sm', large: '--map-pin-size', selected: '--map-pin-size-selected' }
const PIN_PX: Record<PinTier, number> = { dot: 12, small: 32, large: 40, selected: 48 }
const TAIL_PX = 7
const LABEL = 'margin-top:var(--space-0-5);max-width:120px;padding:var(--space-0-5) var(--space-1-5);border-radius:var(--radius-xs);background:var(--map-overlay);color:var(--color-fg);box-shadow:var(--shadow-overlay);font:var(--font-weight-semibold) var(--font-size-xs)/var(--leading-tight) var(--font-family-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
// A pin without a photo is a glyph pin: its head takes the place type's colour with the type icon
// in black (the selected colour when selected). The SDK takes markup, so the icons are rendered
// once, hidden, and their SVG reused.
const TYPE_SVG: Record<string, string> = {}
// The icon of the map chip the place falls under (the Cafés coffee cup on a cafe pin), else the
// place type icon of its interest.
const KIND_ICON: Record<MapKind, LucideIcon> = { restaurant: Utensils, cafe: Coffee, stay: BedDouble, shopping: ShoppingBag, palace: Crown, temple: Flower2, museum: Landmark, park: Trees }
const typeIcon = (p: MapPoi) => {
  const kind = mapKindOf(p)
  const svg = (kind && TYPE_SVG[`kind-${kind}`]) || TYPE_SVG[placeTypeOf(p.interest_category)] || ''
  return `<span aria-hidden style="width:58%;height:58%;display:flex;color:var(--field-fg);stroke-width:2.6">${svg}</span>`
}
const categoryOf = (p: MapPoi) => categoryAttr(p.display_domain)

const pinHtml = (p: MapPoi, tier: PinTier, showName: boolean) => {
  const selected = tier === 'selected'
  if (tier === 'dot') {
    return `<div style="${HIT}" ${markerAttrs(p.poi_id, poiLabel(p), false, categoryOf(p))}><span class="b4k-mark" style="width:var(--map-pin-dot-size);height:var(--map-pin-dot-size);border-radius:calc(var(--map-pin-dot-size) / 3);background:var(--map-pin-fill);border:var(--border-width-2) solid var(--map-pin-stroke)"></span></div>`
  }
  const size = `var(${PIN_SIZE[tier]})`
  // Squircle head, 3 px ring in the pin stroke (the selected colour when selected), pointer below.
  const ring = `var(--border-width-pin) solid ${selected ? 'var(--map-pin-selected)' : 'var(--map-pin-stroke)'}`
  const tail = selected ? 'var(--map-pin-selected)' : 'var(--map-pin-stroke)'
  const head = p.primary_image_url
    ? `background:var(--map-pin-fill) url('${esc(pinSrc(p.primary_image_url))}') center/cover no-repeat`
    : `background:${selected ? 'var(--map-pin-selected)' : `var(--map-type-${mapTypeOf(p)})`};display:flex;align-items:center;justify-content:center`
  const name = showName || selected ? `<span style="${LABEL}">${poiLabel(p)}</span>` : ''
  // Fixed width so the anchor (half of it) stays on the place; a wider name overflows evenly on both sides.
  return `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;width:${Math.max(44, PIN_PX[tier])}px" ${markerAttrs(p.poi_id, poiLabel(p), selected, categoryOf(p))}><span class="b4k-mark" style="box-sizing:border-box;flex-shrink:0;width:${size};height:${size};border-radius:var(--radius-sm);border:${ring};${head};transition:all 160ms var(--easing-out-strong)">${p.primary_image_url ? '' : typeIcon(p)}</span><span aria-hidden style="width:0;height:0;margin-top:-1px;border-left:${TAIL_PX}px solid transparent;border-right:${TAIL_PX}px solid transparent;border-top:${TAIL_PX}px solid ${tail}"></span>${name}</div>`
}
// A cluster is a button named by its place count (not shown on screen); Enter or Space zooms in like a click.
const clusterHtml = (n: number, key: string, name: string) => {
  const size = n < 10 ? '--map-cluster-size-sm' : n < 50 ? '--map-cluster-size-md' : '--map-cluster-size-lg'
  return `<div style="${HIT};width:52px;height:52px" class="b4k-map-marker" role="button" tabindex="0" data-cluster="${esc(key)}" aria-label="${esc(name)}"><span class="b4k-mark" aria-hidden="true" style="box-sizing:border-box;width:var(${size});height:var(${size});border-radius:var(--radius-md);background:var(--map-cluster-fill);border:var(--border-width-pin) solid var(--map-cluster-stroke);--mark-shadow:var(--shadow-cluster);display:flex;align-items:center;justify-content:center;color:var(--map-cluster-fg);font:var(--font-weight-extrabold) var(--font-size-xs)/var(--leading-tight) var(--font-family-body);font-variant-numeric:tabular-nums">${n}</span></div>`
}
// Numbered plan pin: a 34 squircle in the day colour, 3 px black ring in both themes, 14/800 black figures.
const stopHtml = (p: MapPoi, order: number, day: number, selected: boolean, dimmed = false) =>
  `<div style="${HIT}${dimmed ? `;opacity:${OTHER_DAY_OPACITY}` : ''}" ${markerAttrs(p.poi_id, `${order}. ${poiLabel(p)}`, selected, categoryOf(p))}><span class="b4k-mark" style="box-sizing:border-box;width:var(--stop-badge-size-md);height:var(--stop-badge-size-md);border-radius:var(--radius-sm);background:${selected ? 'var(--map-pin-selected)' : `var(--plan-day-${day})`};color:var(--plan-day-${day}-fg);border:var(--border-width-pin) solid var(--field-fg);display:flex;align-items:center;justify-content:center;font:var(--font-weight-extrabold) var(--font-size-sm)/1 var(--font-family-body);font-variant-numeric:tabular-nums">${order}</span></div>`

// Inset kept around fitted pins: space-20, read from the token so the map follows it.
function fitPadding(bottom: number, top?: number) {
  const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-20')) || 80
  return { top: top ?? pad, right: pad, bottom: pad + bottom, left: pad }
}

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
// The GL module runs after maps.js itself: a map made before it is a raster map.
const sdkLoaded = (lang: string) => sdkAlive() && sdkLang === lang && (!GL_SDK || !!window.naver.maps.jsContentLoaded)

// The theme only picks the style when a separate dark style is set; otherwise it is not watched.
const THEMED = !!MAP_STYLE.dark && MAP_STYLE.dark !== MAP_STYLE.light
const subscribeTheme = (onChange: () => void) => {
  if (!THEMED) return () => {}
  const o = new MutationObserver(onChange)
  o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => o.disconnect()
}
const themeNow = () => (THEMED ? document.documentElement.dataset.theme : undefined)
type MapView = { lat: number; lng: number; zoom: number }

// The SDK reads the style and the language only when it makes a map (the language only when maps.js
// loads), so a theme or language switch makes a new map (a new canvas, keyed by both) at the view
// the old one had.
export const V2MapCanvas = forwardRef<V2MapHandle, Props>(function V2MapCanvas(props, ref) {
  const styleId = styleFor(useSyncExternalStore(subscribeTheme, themeNow, () => undefined))
  const lang = NAVER_LANG[useLocale()] ?? 'en'
  const view = useRef<MapView | null>(null)
  return <Canvas key={`${styleId}:${lang}`} ref={ref} {...props} styleId={styleId} lang={lang} view={view} />
})

const Canvas = forwardRef<V2MapHandle, Props & { styleId: string; lang: string; view: MutableRefObject<MapView | null> }>(function Canvas(
  { pois, selectedId, onSelect, planStops = [], activeDay = 'all', savedIds, routeLegs, onBounds, onZoom, center, openAt, holdOpen, fitStops, fitBottom = 0, fitTop, userLocation, label, errorText, styleId, lang, view },
  ref,
) {
  const el = useRef<HTMLDivElement>(null)
  const icons = useRef<HTMLDivElement>(null)
  // The hidden type icons' SVG for the pins without a photo, read before the markers draw.
  useLayoutEffect(() => {
    icons.current?.querySelectorAll<SVGElement>('svg[data-type]').forEach((svg) => { TYPE_SVG[svg.dataset.type ?? ''] = svg.outerHTML.replace(/stroke-width="[\d.]+"/, 'stroke-width="2.6"') })
  }, [])
  const map = useRef<any>(null)
  const overlays = useRef<any[]>([])
  const lines = useRef<any[]>([])
  const [ready, setReady] = useState(() => sdkLoaded(lang))
  // A language switch without a page load (the locale router) finds the SDK made in the old
  // language: it is dropped before the Script below loads maps.js again in the new one.
  useLayoutEffect(() => {
    if (sdkAlive() && sdkLang !== lang) {
      delete window.naver
      sdkLang = null
    }
  }, [lang])
  // The SDK can hand back a map before its projection exists (a second load in the same tab);
  // pins and fits wait for the map's init (or first idle) event.
  const [mapReady, setMapReady] = useState(false)
  const [zoom, setZoom] = useState(OPEN_ZOOM)
  const [failed, setFailed] = useState(false)
  // The style could not load: this canvas shows the raster map instead.
  const [glFailed, setGlFailed] = useState(false)
  const gl = !!styleId && !glFailed
  // The vector map is on: without a GPU fit for it (or after a lost WebGL context) the SDK draws
  // the raster map with the Naver look, and the pins stay dark.
  const [glOn, setGlOn] = useState(false)
  const getZ = () => map.current.getZoom() + ZOOM_SHIFT
  const setZ = (z: number, animate: boolean) => map.current.setZoom(z - ZOOM_SHIFT, animate)
  const glWatch = useRef<number | undefined>(undefined)
  // maps.js ran. With a style its GL module still loads after it, and the SDK marks its modules
  // loaded only for a page that waits for them.
  const sdkReady = () => {
    // next/script loads a src once per page: back on a language whose SDK was dropped, it only
    // reports it ready, and a page load brings that SDK back.
    if (!sdkAlive()) return window.location.reload()
    sdkLang = lang
    if (sdkLoaded(lang)) return setReady(true)
    window.naver.maps.onJSContentLoaded = () => setReady(true)
  }
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const select = useRef(onSelect)
  select.current = onSelect
  const t = useCd()
  const clusterZoom = useRef(new Map<string, () => void>())
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
  // The last points fitted by request: when the room under the map changes (a phone sheet moves),
  // they are fitted again into the new visible area, until the person drags the map.
  const lastFit = useRef<{ lat: number; lng: number }[] | null>(null)
  const live = () => (map.current && sdkAlive() ? map.current : null)

  const fitPoints = (points: { lat: number; lng: number }[]) => {
    if (!live() || !points.length) return
    const N = window.naver.maps
    // Phones pass the room the bars and the sheet take: fit into the box between them by hand,
    // since the SDK's fit drops a margin that leaves only a thin band of map.
    if (fitTop !== undefined) return fitIntoBox(points)
    if (points.length === 1) return map.current.setCenter(new N.LatLng(points[0].lat, points[0].lng))
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    if (GL_SDK) return fitAsRaster(lats, lngs, fitPadding(fitBottom, fitTop))
    map.current.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...lats), Math.min(...lngs)), new N.LatLng(Math.max(...lats), Math.max(...lngs))), fitPadding(fitBottom, fitTop))
  }

  // Web Mercator: world pixels at zoom 0 (256 wide), so zoom z multiplies them by 2^z.
  const worldX = (lng: number) => ((lng + 180) / 360) * 256
  const worldY = (lat: number) => {
    const s = Math.sin((lat * Math.PI) / 180)
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256
  }
  const fromWorld = (x: number, y: number) => ({
    lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 256))) * 180) / Math.PI,
    lng: (x / 256) * 360 - 180,
  })
  // The raster map's fitBounds, by hand for the vector map (whose own fit lands on a fractional zoom
  // with the points on the padding's edge), as the raster SDK does it: the closest whole zoom that
  // holds the points without padding; the points' box grown by the padding at that zoom; then a
  // zoom out at a time until the view holds the grown box. The first check is centred on the
  // points, the later ones on the grown box, which is where the map ends up.
  const fitAsRaster = (lats: number[], lngs: number[], pad: { top: number; right: number; bottom: number; left: number }) => {
    const N = window.naver.maps
    const size = map.current.getSize()
    const xs = lngs.map(worldX)
    const ys = lats.map(worldY)
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const spanX = maxX - minX
    const spanY = maxY - minY
    const start = Math.min(21, Math.floor(Math.log2(Math.min(spanX ? size.width / spanX : Infinity, spanY ? size.height / spanY : Infinity))))
    const k = 2 ** start
    const box = { left: minX - pad.left / k, right: maxX + pad.right / k, top: minY - pad.top / k, bottom: maxY + pad.bottom / k }
    const cx = (box.left + box.right) / 2
    const cy = (box.top + box.bottom) / 2
    const holds = (z: number, x: number, y: number) => {
      const w = size.width / 2 / 2 ** z
      const h = size.height / 2 / 2 ** z
      return box.left >= x - w && box.right <= x + w && box.top >= y - h && box.bottom <= y + h
    }
    let zoom = start
    if (!holds(zoom, (minX + maxX) / 2, (minY + maxY) / 2)) {
      do zoom--
      while (zoom > 0 && !holds(zoom, cx, cy))
    }
    const c = fromWorld(cx, cy)
    setZ(zoom, false)
    map.current.setCenter(new N.LatLng(c.lat, c.lng))
  }
  const fitIntoBox = (points: { lat: number; lng: number }[]) => {
    const N = window.naver.maps
    const size = map.current.getSize()
    const side = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-6')) || 24
    const top = fitTop ?? 0
    const box = { left: side, right: size.width - side, top, bottom: size.height - fitBottom - 80 }
    const boxW = Math.max(1, box.right - box.left)
    const boxH = Math.max(1, box.bottom - box.top)
    const xs = points.map((p) => worldX(p.lng))
    const ys = points.map((p) => worldY(p.lat))
    const spanX = Math.max(...xs) - Math.min(...xs)
    const spanY = Math.max(...ys) - Math.min(...ys)
    // One stop keeps the zoom; more get the closest whole zoom that holds them, never past the opening zoom.
    const zoom = points.length === 1 || (!spanX && !spanY) ? getZ() : Math.max(6, Math.min(OPEN_ZOOM, Math.floor(Math.log2(Math.min(spanX ? boxW / spanX : Infinity, spanY ? boxH / spanY : Infinity)))))
    const scale = 2 ** zoom
    // The points' middle goes to the box's middle: the map centre sits that far from it.
    const midX = ((Math.max(...xs) + Math.min(...xs)) / 2) * scale
    const midY = ((Math.max(...ys) + Math.min(...ys)) / 2) * scale
    const dx = (box.left + box.right) / 2 - size.width / 2
    const dy = (box.top + box.bottom) / 2 - size.height / 2
    const c = fromWorld((midX - dx) / scale, (midY - dy) / scale)
    try {
      if (localStorage.getItem('b4k-debug-fit')) console.debug('[b4k fit]', { size: [size.width, size.height], box, zoom, points: points.length })
    } catch {}
    setZ(zoom, false)
    map.current.setCenter(new N.LatLng(c.lat, c.lng))
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => live() && setZ(getZ() + 1, true),
    zoomOut: () => live() && setZ(getZ() - 1, true),
    panTo: (lat, lng) => live()?.panTo(new window.naver.maps.LatLng(lat, lng)),
    focus: (lat, lng, bottom = 0) => {
      const m = live()
      if (!m) return
      const N = window.naver.maps
      if (getZ() < PICK_ZOOM) setZ(PICK_ZOOM, false)
      const at = new N.LatLng(lat, lng)
      const proj = mapReady ? m.getProjection() : null
      if (!proj || !bottom) return m.panTo(at)
      // The visible centre sits bottom/2 above the canvas centre: aim the canvas centre that far below the place.
      const o = proj.fromCoordToOffset(at)
      m.panTo(proj.fromOffsetToCoord(new N.Point(o.x, o.y + bottom / 2)))
    },
    fitTo: (points) => {
      lastFit.current = points
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
      if (sdkLoaded(lang)) setReady(true)
    }, 200)
    return () => window.clearInterval(t)
  }, [ready, lang])

  // Create the map once the SDK is there.
  useEffect(() => {
    if (!ready || !el.current || map.current || !sdkAlive() || (holdOpen && !openAt)) return
    const N = window.naver.maps
    // Opening on a place: its centre as focus() would set it (the place bottom/2 above the canvas
    // centre), worked out before the map exists so the first tiles are already in place.
    // A canvas made for a new style opens where the last one was.
    const s = 2 ** PICK_ZOOM
    const was = view.current
    const c = was ?? (openAt ? fromWorld(worldX(openAt.lng), worldY(openAt.lat) + openAt.bottom / 2 / s) : center ?? SEOUL)
    map.current = new N.Map(el.current, {
      center: new N.LatLng(c.lat, c.lng),
      zoom: (was ? was.zoom : openAt ? Math.max(OPEN_ZOOM, PICK_ZOOM) : OPEN_ZOOM) - ZOOM_SHIFT,
      zoomControl: false,
      mapDataControl: false,
      scaleControl: false,
      logoControlOptions: { position: N.Position.BOTTOM_LEFT },
      ...(gl ? { gl: true, customStyleId: styleId } : {}),
    })
    if (gl) {
      // The SDK empties the map element when it tears the map down; until the map's init, that
      // means the style failed.
      let inited = false
      N.Event.once(map.current, 'init', () => {
        inited = true
      })
      const since = Date.now()
      glWatch.current = window.setInterval(() => {
        if (inited || Date.now() - since > GL_WATCH_MS) return window.clearInterval(glWatch.current)
        if (el.current?.firstChild) return
        window.clearInterval(glWatch.current)
        map.current = null
        setGlFailed(true)
      }, 500)
    }
    // The vector map is really drawn (not the raster fallback): pin tone and the B4K look follow it.
    const glCheck = () => {
      const on = !!map.current.getOptions('gl')
      setGlOn(on)
      if (on && RESTYLE) keepMapLook(map.current, toneFor(styleId))
    }
    const idle = () => {
      // The SDK can still fire events on a map it has torn down.
      if (!live()) return
      const z = getZ()
      if (gl) glCheck()
      const at = map.current.getCenter()
      view.current = { lat: at.lat(), lng: at.lng(), zoom: z }
      setZoom(z)
      onZoom?.(z)
      onBounds?.(boundsOf(map.current), z)
    }
    N.Event.addListener(map.current, 'idle', () => {
      setMapReady(true)
      idle()
    })
    N.Event.once(map.current, 'init', () => {
      setMapReady(true)
      if (gl && live()) glCheck()
    })
    N.Event.addListener(map.current, 'click', () => select.current(null))
    N.Event.addListener(map.current, 'dragstart', () => {
      lastFit.current = null
    })
    // Keyboard on a focused pin, stop or cluster: Enter or Space selects it (a cluster zooms in).
    el.current.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const cluster = (e.target as HTMLElement | null)?.closest?.('[data-cluster]')?.getAttribute('data-cluster')
      const zoomIn = cluster ? clusterZoom.current.get(cluster) : undefined
      if (zoomIn) {
        e.preventDefault()
        e.stopPropagation()
        return zoomIn()
      }
      const id = (e.target as HTMLElement | null)?.closest?.('[data-poi-id]')?.getAttribute('data-poi-id')
      if (!id) return
      e.preventDefault()
      e.stopPropagation()
      select.current(id)
    })
    idle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, holdOpen, openAt?.lat, openAt?.lng, glFailed])

  // A vector map holds a WebGL context: a canvas that goes (a theme switch, a page change) frees it.
  useEffect(
    () => () => {
      window.clearInterval(glWatch.current)
      if (GL_SDK && map.current) {
        try {
          map.current.destroy()
        } catch {}
      }
    },
    [],
  )

  // The sheet over the map changed height: fit the last requested points into the new visible area.
  // Waits for the sheet to settle (its height eases over a few frames) so the map moves once.
  useEffect(() => {
    if (!mapReady || !lastFit.current) return
    const t = setTimeout(() => lastFit.current && fitPoints(lastFit.current), 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBottom, fitTop, mapReady])

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
    if (fitTop !== undefined) return fitIntoBox(planStops.map((s) => ({ lat: s.poi.coords_lat, lng: s.poi.coords_lng })))
    const lats = planStops.map((s) => s.poi.coords_lat)
    const lngs = planStops.map((s) => s.poi.coords_lng)
    if (GL_SDK) return fitAsRaster(lats, lngs, fitPadding(fitBottom, fitTop))
    map.current.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...lats), Math.min(...lngs)), new N.LatLng(Math.max(...lats), Math.max(...lngs))), fitPadding(fitBottom, fitTop))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitStops, planStops, mapReady, fitBottom, fitTop])

  // Location dot: 16 dot with a 2 px ring on a 40 accuracy halo, above the place pins (below a
  // selected one); taps go through it to the pins. Colors follow the map tone like the pins.
  useEffect(() => {
    if (!live() || !mapReady || !userLocation) return
    const N = window.naver.maps
    const html = `<div aria-hidden style="pointer-events:none;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-full);background:color-mix(in srgb, var(--accent-avatar) 30%, transparent)"><span style="box-sizing:border-box;width:16px;height:16px;border-radius:var(--radius-full);background:var(--accent-avatar);border:var(--border-width-pin) solid var(--map-pin-stroke)"></span></div>`
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
    clusterZoom.current.clear()
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
      buckets.forEach((members, key) => {
        if (members.length === 1) return addPin(members[0])
        const lat = members.reduce((sum, p) => sum + p.coords_lat, 0) / members.length
        const lng = members.reduce((sum, p) => sum + p.coords_lng, 0) / members.length
        const zoomIn = () => {
          fitPoints(members.map((p) => ({ lat: p.coords_lat, lng: p.coords_lng })))
          if (live() && getZ() > 17) setZ(17, true)
        }
        clusterZoom.current.set(key, zoomIn)
        add(lat, lng, clusterHtml(members.length, key, t('CD1857', { count: members.length })), { x: 26, y: 26 }, zoomIn, Z.cluster * Z_LAYER)
      })
    } else {
      for (const p of rest) addPin(p)
    }
    if (sel) addPin(sel)
    for (const s of planStops) {
      const dimmed = activeDay !== 'all' && s.day !== activeDay && s.poi.poi_id !== selectedId
      add(s.poi.coords_lat, s.poi.coords_lng, stopHtml(s.poi, s.order, s.day, s.poi.poi_id === selectedId, dimmed), { x: 22, y: 22 }, () => select.current(s.poi.poi_id), (s.poi.poi_id === selectedId ? Z.selected : dimmed ? Z.saved : Z.stop) * Z_LAYER)
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
      ? routeLegs.map((l) => ({ day: l.day, path: l.path }))
      : Array.from(new Set(planStops.map((s) => s.day)))
          .map((day) => ({ day, path: planStops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => ({ lat: s.poi.coords_lat, lng: s.poi.coords_lng })) }))
    // One line per day in the day colour, 5 wide with round ends; light maps draw a 9 wide dark casing
    // under each line so the pastel colours hold on light ground.
    const casing = TOKEN_HEX[theme].routeCasing
    const width = (name: string, fallback: number) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback
    // With one day chosen, the other days stay drawn under it at OTHER_DAY_OPACITY, casing included.
    for (const p of paths) {
      if (p.path.length < 2) continue
      const path = p.path.map((x) => new N.LatLng(x.lat, x.lng))
      const other = activeDay !== 'all' && p.day !== activeDay
      const opacity = other ? OTHER_DAY_OPACITY : 1
      const z = other ? 0 : 2
      if (casing) {
        lines.current.push(new N.Polyline({ map: map.current, path, strokeColor: casing, strokeWeight: width('--route-casing-width', 9), strokeOpacity: opacity, strokeLineCap: 'round', strokeLineJoin: 'round', zIndex: z + 1 }))
      }
      lines.current.push(new N.Polyline({ map: map.current, path, strokeColor: color(p.day), strokeWeight: width('--route-width', 5), strokeOpacity: opacity, strokeLineCap: 'round', strokeLineJoin: 'round', zIndex: z + 2 }))
    }
  }, [planStops, routeLegs, activeDay, ready])

  return (
    // isolate: the SDK gives its logo and controls a high z-index; keep them under sheets and dialogs.
    <div className="relative isolate size-full bg-map-ui-ground">
      {clientId ? (
        <Script src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder${GL_SDK ? ',gl' : ''}&language=${lang}`} strategy="afterInteractive" onReady={sdkReady} onError={() => setFailed(true)} />
      ) : null}
      <div ref={el} role="application" aria-label={label} data-map-tone={toneFor(glOn ? styleId : '')} className="size-full" />
      <div ref={icons} hidden>
        {Object.entries(PLACE_TYPE_ICON).map(([type, Icon]) => <Icon key={type} data-type={type} width="100%" height="100%" aria-hidden />)}
        {Object.entries(KIND_ICON).map(([kind, Icon]) => <Icon key={kind} data-type={`kind-${kind}`} width="100%" height="100%" aria-hidden />)}
      </div>
      {failed || !clientId ? (
        <p role="alert" className="absolute inset-0 flex items-center justify-center p-[var(--space-6)] text-center type-body-base text-ui-fg-muted">{errorText}</p>
      ) : null}
    </div>
  )
})
