'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { Plus, Minus, Sparkles, X, MapPinOff } from 'lucide-react'
import type { MapPoi, MapBounds } from '@/hooks/useMapPois'
import { getDisplayName } from '@/lib/display-name'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { naver: any; navermap_authFailure?: () => void }
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
  // Guarantees this POI renders individually (never clustered, never
  // same-point-collapsed) even if it's outside the loaded `pois` array, and
  // pans to it — e.g. a deep-linked/searched/bookmarked POI the current
  // viewport fetch hasn't loaded. Ambient mode only — ignored while
  // restrictToPois is active (exclusive sets are already fully individual).
  focusPoi?: MapPoi | null
  // SC-31 (S-HDTVGP) — when active (Saved-hub folder, search results, a
  // single bookmarked focus, etc.), ONLY these POIs show — never clustered,
  // never same-point-collapsed — regardless of whether they're present in
  // `pois`. Full objects (not ids intersected against `pois`) so an exclusive
  // set member outside the loaded viewport still renders.
  restrictToPois?: MapPoi[] | null
  // BLK-39 — region-chip pan/zoom. Unlike restrictToPois, does NOT change
  // what's rendered/clustered (pois stays the live render+cluster set) —
  // this only drives a one-shot camera fit when the caller hands us a new
  // array reference (region selection). Caller controls reference stability.
  cameraFocusPois?: MapPoi[] | null
  // Viewport-bounds fetching — fired on 'idle' (debounced, padded, threshold-
  // gated below), so useMapPois can request POIs in the visible area instead
  // of a fixed nationwide top-N. Omitted/no calls yet → caller stays on its
  // no-bounds fallback (nationwide top-N) until the first idle settles.
  onBoundsChange?: (bounds: MapBounds, zoom: number) => void
  // Initial camera, consumed once at construction only — defaults to the
  // Seoul/zoom-12 fallback so every existing caller is unaffected. For a
  // single-POI view (e.g. /place/:id) this should be that POI's coords.
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
  // Whether useMapPois's fetch for the current viewport is still in flight —
  // gates the empty-viewport overlay below so it doesn't flash during load.
  poisLoading?: boolean
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
  // .poi-hit is an invisible 44px hit-area wrapper (CLAUDE.md §6 touch-target
  // minimum) — .poi-wrap/.poi-dot/.poi-trending stay exactly as they were,
  // untouched, so the trending pulse ring's positioning can't regress.
  return `<div class="poi-hit"><div class="poi-wrap${sel}${tr}"><div class="poi-dot"></div></div></div>`
}

function planMarkerHtml(index: number, selected: boolean): string {
  const sel = selected ? ' plan-marker--selected' : ''
  // .plan-marker-hit is an invisible 44px hit-area wrapper (CLAUDE.md §6
  // touch-target minimum) — the visual circle inside stays its existing size.
  return `<div class="plan-marker-hit"><div class="plan-marker${sel}">${index + 1}</div></div>`
}

function clusterMarkerHtml(count: number): string {
  // "+N" not bare "N" — a bare number is visually identical to plan-marker's
  // numbered stop bubble (same size class, both plain circles). The "+"
  // reads as "N more here" and disambiguates by content, not a redesign.
  // .poi-cluster-hit is the same 44px invisible hit-area wrapper as above.
  return `<div class="poi-cluster-hit"><div class="poi-cluster">+${count}</div></div>`
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
  focusPoi = null,
  restrictToPois = null,
  cameraFocusPois = null,
  onBoundsChange,
  initialCenter,
  initialZoom,
  poisLoading = false,
}: Props) {
  const t = useTranslations('map')
  // For the aria-live selection announcement below — fires whether selection
  // came from a pin tap or LeftPanel, since both set the same selectedPoiId.
  // Deliberately not pin keyboard-focus/tabIndex (DEC-22: LeftPanel is the
  // keyboard path to POIs, not individual map pins).
  const selectedPoi = pois.find(p => p.poi_id === selectedPoiId) ?? null
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
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

  // Naver Maps v3 calls window.navermap_authFailure (if defined) when its own
  // async auth check fails — the script itself already loaded fine (onLoad
  // already fired, initMap already ran), so this is the only signal that
  // window.naver.maps is about to go dead. Without this, a failed auth just
  // shows Naver's own Korean-only banner over a blank canvas with our POI
  // markers still floating on top — reusing the existing scriptErr UI here
  // instead gives a real, i18n'd, on-brand fallback. Registered before any
  // script load can complete, so it's never missed regardless of mount timing.
  useEffect(() => {
    window.navermap_authFailure = () => setScriptErr(true)
    return () => { delete window.navermap_authFailure }
  }, [])

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
    const center = initialCenter ?? SEOUL
    const map = new window.naver.maps.Map(containerRef.current, {
      center:                 new window.naver.maps.LatLng(center.lat, center.lng),
      zoom:                   initialZoom ?? 12,
      mapTypeControl:         false,
      scaleControl:           false,
      logoControl:            true,
      mapDataControl:         false,
      zoomControl:            false,
      // Base-manipulation parity with Google/Naver/Kakao (DEC-62) — min/max
      // zoom fixes real inconsistency: without this, scroll/pinch/fitBounds
      // could zoom past what the +/- buttons and cluster-click already clamp
      // to. The rest are explicit declarations of already-true native
      // defaults, so a future SDK bump or edit can't silently drop one.
      // minZoom below 6 is rejected by the Naver SDK itself ("Please set the
      // minimum zoom level to 6 or higher") — confirmed live on production,
      // an invalid value here breaks map init entirely, not just the clamp.
      minZoom:                6,
      maxZoom:                18,
      draggable:              true,
      pinchZoom:              true,
      scrollWheel:            true,
      keyboardShortcuts:      true,
      disableDoubleClickZoom: false,
      disableKineticPan:      false,
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

    // Grab/grabbing cursor affordance during pan — matches Google/Naver/Kakao
    // (DEC-62 base-manipulation parity). Purely visual, no gesture logic.
    window.naver.maps.Event.addListener(map, 'dragstart', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
    })
    window.naver.maps.Event.addListener(map, 'dragend', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'grab'
    })

    // The SDK measures the container once at construction and never re-checks
    // it — any later resize (mobile URL-bar collapse, locale font swap
    // reflow, sidebar toggle) leaves the SDK's internal coordinate system
    // stale, so drag/click hit-testing drifts off the visible pins. Naver
    // Maps v3 requires an explicit 'resize' trigger + recenter to rebuild it;
    // there's no auto-relayout.
    const resizeObserver = new ResizeObserver(() => {
      // Auth can fail after the SDK script itself loaded (blocked domain,
      // CSP scheme mismatch in dev, Naver-side auth error) — window.naver.maps
      // goes null in that case, and a resize firing afterward would otherwise
      // throw uncaught here.
      if (!window.naver?.maps) return
      window.naver.maps.Event.trigger(map, 'resize')
      map.setCenter(map.getCenter())
    })
    resizeObserver.observe(containerRef.current)
    resizeObserverRef.current = resizeObserver

    setMapReady(true)
  }

  // Sync markers — regular POIs + plan numbered markers.
  // Plan-stop POIs are never clustered — they're the numbered route, always visible.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps) return
    const map = mapRef.current
    const clusterActive = zoom <= CLUSTER_ZOOM_THRESHOLD && !restrictToPois

    const visiblePois = restrictToPois ?? pois

    // focusPoi is additive (ambient mode only) — a no-op while restrictToPois
    // is active, since an exclusive set is already fully individual (see
    // clusterActive/same-point gates below), whether or not focusPoi happens
    // to be a member of it.
    const showFocus = !!focusPoi && !restrictToPois && !planStopIds.includes(focusPoi.poi_id)

    const planPois = visiblePois.filter(p => planStopIds.includes(p.poi_id))
    const freePois = visiblePois.filter(p =>
      !planStopIds.includes(p.poi_id) &&
      !(showFocus && p.poi_id === focusPoi!.poi_id)
    )

    const clusteredIds = new Set<string>()
    const clusterGroups: MapPoi[][] = []

    // Same-point atoms — exact-duplicate-coordinate POIs (e.g. every tenant
    // store inside one department store inherits the building's single
    // geocoded point — a data issue, not a rendering one) must always
    // collapse into one bubble regardless of zoom, or they'd render as
    // literally-overlapping, unclickable dots. Rounds to 5 decimals (~1m) —
    // tight enough to only catch true duplicates, not just-nearby distinct
    // storefronts. Kept as atoms (not pushed to clusterGroups yet) so the
    // pixel-space merge pass below can still absorb one into a nearby
    // distinct-POI cluster — two same-point groups a few dozen pixels apart
    // (e.g. two different buildings' duplicate-tenant clusters) previously
    // could never merge with each other or anything else, since this pass
    // ran before and independently of the proximity-based one.
    type Atom = { members: MapPoi[]; lat: number; lng: number }
    const samePointAtoms: Atom[] = []
    if (!restrictToPois) {
      const samePointBuckets = new Map<string, MapPoi[]>()
      freePois.forEach(poi => {
        const key = `${poi.coords_lat.toFixed(5)}:${poi.coords_lng.toFixed(5)}`
        const bucket = samePointBuckets.get(key)
        if (bucket) bucket.push(poi); else samePointBuckets.set(key, [poi])
      })
      samePointBuckets.forEach(members => {
        if (members.length >= 2) {
          samePointAtoms.push({ members, lat: members[0].coords_lat, lng: members[0].coords_lng })
          members.forEach(m => clusteredIds.add(m.poi_id))
        }
      })
    }

    if (clusterActive) {
      // One unified pixel-space merge pass over same-point atoms AND every
      // remaining individual free POI together — this is what lets a
      // same-point cluster absorb (or be absorbed by) a nearby distinct POI.
      // Screen-pixel space, not raw lat/lng degrees, via the map's projection
      // — a fixed-size cluster bubble is drawn at a fixed pixel size
      // regardless of zoom, so two atoms can be geographically distinct yet
      // still project to overlapping/adjacent screen positions at some zoom
      // levels. Falls back to the old degree-based grid if the projection
      // API isn't available for some reason (defensive, shouldn't normally
      // fire).
      let projection: { fromCoordToOffset: (c: unknown) => { x: number; y: number } } | null = null
      try {
        const p = map.getProjection?.()
        if (p && typeof p.fromCoordToOffset === 'function') projection = p
      } catch { /* fall back below */ }
      // 80px, not the ~32px bubble diameter — live-verified on prod that 48px
      // still left two bubbles touching at a corner (4px gap): a merge/no-merge
      // decision this close to a bubble's own size reads as "overlapping" even
      // when the bounding boxes technically don't intersect. Generous margin.
      const PIXEL_CELL = 80
      const gridSize = clusterGridSize(zoom)

      const atoms: Atom[] = [
        ...samePointAtoms,
        ...freePois.filter(p => !clusteredIds.has(p.poi_id)).map(p => ({ members: [p], lat: p.coords_lat, lng: p.coords_lng })),
      ]

      const buckets = new Map<string, Atom[]>()
      const bucketCoords = new Map<string, [number, number]>()
      atoms.forEach(atom => {
        let gx: number, gy: number
        if (projection) {
          const pt = projection.fromCoordToOffset(new window.naver.maps.LatLng(atom.lat, atom.lng))
          gx = Math.floor(pt.x / PIXEL_CELL)
          gy = Math.floor(pt.y / PIXEL_CELL)
        } else {
          gx = Math.floor(atom.lat / gridSize)
          gy = Math.floor(atom.lng / gridSize)
        }
        const key = `${gx}:${gy}`
        bucketCoords.set(key, [gx, gy])
        const bucket = buckets.get(key)
        if (bucket) bucket.push(atom); else buckets.set(key, [atom])
      })

      // Merge cells within a 2-cell radius. Plain floor-division bucketing has
      // hard cell boundaries — two atoms a few meters apart can land in
      // non-adjacent cells if they straddle one, rendering as two separate
      // cluster bubbles sitting right next to (or on top of) each other on
      // screen instead of one. Union-find over cell adjacency collapses those
      // into a single group.
      const keys = Array.from(buckets.keys())
      const parent = new Map<string, string>(keys.map(k => [k, k]))
      const find = (k: string): string => {
        while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k)!)!); k = parent.get(k)! }
        return k
      }
      const union = (a: string, b: string) => {
        const ra = find(a), rb = find(b)
        if (ra !== rb) parent.set(ra, rb)
      }
      keys.forEach(k => {
        const [gx, gy] = bucketCoords.get(k)!
        // Radius 2 (not 1) — a point near the far edge of its cell and another
        // near the far edge of a cell 2 away can still be closer on screen than
        // two points in the same cell would be. Widening the search catches
        // that grid-phase edge case without needing true distance math.
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            if (dx === 0 && dy === 0) continue
            const nk = `${gx + dx}:${gy + dy}`
            if (buckets.has(nk)) union(k, nk)
          }
        }
      })
      const merged = new Map<string, MapPoi[]>()
      keys.forEach(k => {
        const root = find(k)
        const group = merged.get(root) ?? []
        buckets.get(k)!.forEach(atom => group.push(...atom.members))
        merged.set(root, group)
      })

      merged.forEach(members => {
        if (members.length >= 2) {
          clusterGroups.push(members)
          members.forEach(m => clusteredIds.add(m.poi_id))
        }
      })
    } else {
      // Past the cluster zoom threshold, only same-point duplicates still
      // merge — distinct-but-nearby POIs render as separate, individually
      // legible pins.
      samePointAtoms.forEach(atom => clusterGroups.push(atom.members))
    }

    const individualPois = [
      ...planPois,
      ...(showFocus ? [focusPoi!] : []),
      ...freePois.filter(p => !clusteredIds.has(p.poi_id)),
    ]
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
            size:   new window.naver.maps.Size(44, 44),
            anchor: new window.naver.maps.Point(22, 22),
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
          size:   new window.naver.maps.Size(44, 44),
          anchor: new window.naver.maps.Point(22, 22),
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
            size:    new window.naver.maps.Size(44, 44),
            anchor:  new window.naver.maps.Point(22, 22),
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
  }, [mapReady, pois, selectedPoiId, planStopIds, onPoiSelect, zoom, restrictToPois, focusPoi])

  // Pan to the selected POI whenever selection CHANGES externally (e.g.
  // LeftPanel card click) — marker click already pans itself, this covers
  // every other selection source.
  //
  // Fundamentals bug fix: this must fire once per selection change, not once
  // per render where selectedPoiId happens to still be set. The old
  // dependency array included `pois`, which gets a new array reference on
  // every viewport-bounds refetch (any idle-triggered pan/zoom while a POI is
  // selected) — so after a user selected a pin and then tried to pan away,
  // the next bounds refetch re-ran this effect and panTo'd straight back to
  // the same pin, making the camera feel locked. Track the last poi_id we
  // actually panned for in a ref, and only call panTo when the selection
  // itself changes — a `pois`/`focusPoi` refresh with the same selectedPoiId
  // must never re-trigger the pan.
  //
  // Prefers focusPoi (works even when the POI is outside `pois`, e.g. a
  // deep-linked/searched/bookmarked POI the viewport fetch hasn't loaded),
  // falling back to a `pois` lookup for the ordinary in-viewport case.
  // Gated off during exclusive mode so it never fights the restrictToPois
  // fitBounds effect below.
  const lastPannedPoiIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps || !selectedPoiId || restrictToPois) return
    if (lastPannedPoiIdRef.current === selectedPoiId) return
    const poi = (focusPoi?.poi_id === selectedPoiId ? focusPoi : null) ?? pois.find(p => p.poi_id === selectedPoiId)
    if (!poi) return
    lastPannedPoiIdRef.current = selectedPoiId
    mapRef.current.panTo(new window.naver.maps.LatLng(poi.coords_lat, poi.coords_lng))
  }, [selectedPoiId, mapReady, pois, focusPoi, restrictToPois])

  // Selection cleared (deselect) — allow the next selection of the SAME poi
  // (re-clicking after deselecting) to pan again.
  useEffect(() => {
    if (!selectedPoiId) lastPannedPoiIdRef.current = null
  }, [selectedPoiId])

  // Fit the viewport to an active exclusive set once per activation — e.g.
  // opening a saved folder or a search-results/bookmark "view on map" action.
  // Fires once when restrictToPois first populates and re-arms when it
  // clears, mirroring the hasFitRouteRef pattern below. Kept as its own
  // effect (not merged with focusPoi's pan effect above) so the two camera
  // behaviors never fire in the same tick.
  const hasFitRestrictRef = useRef(false)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps) return
    if (!restrictToPois || restrictToPois.length === 0) {
      hasFitRestrictRef.current = false
      return
    }
    if (hasFitRestrictRef.current) return
    hasFitRestrictRef.current = true

    if (restrictToPois.length === 1) {
      mapRef.current.setCenter(new window.naver.maps.LatLng(restrictToPois[0].coords_lat, restrictToPois[0].coords_lng))
      mapRef.current.setZoom(15)
      return
    }

    const bounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(restrictToPois[0].coords_lat, restrictToPois[0].coords_lng),
      new window.naver.maps.LatLng(restrictToPois[0].coords_lat, restrictToPois[0].coords_lng),
    )
    restrictToPois.forEach(p => bounds.extend(new window.naver.maps.LatLng(p.coords_lat, p.coords_lng)))
    mapRef.current.fitBounds(bounds)
  }, [mapReady, restrictToPois])

  // BLK-39 — region-chip pan/zoom. Reference-equality lock (not the boolean
  // flag above) because the caller (MapView) only hands us a new array when
  // it actually wants a new fit (region switched) — safe to compare by
  // identity, unlike restrictToPois which gets a fresh mapped array every
  // render at the call site.
  const lastCameraFocusRef = useRef<MapPoi[] | null>(null)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps) return
    if (!cameraFocusPois || cameraFocusPois.length === 0) {
      lastCameraFocusRef.current = null
      return
    }
    if (lastCameraFocusRef.current === cameraFocusPois) return
    lastCameraFocusRef.current = cameraFocusPois

    if (cameraFocusPois.length === 1) {
      mapRef.current.setCenter(new window.naver.maps.LatLng(cameraFocusPois[0].coords_lat, cameraFocusPois[0].coords_lng))
      mapRef.current.setZoom(15)
      return
    }

    const bounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(cameraFocusPois[0].coords_lat, cameraFocusPois[0].coords_lng),
      new window.naver.maps.LatLng(cameraFocusPois[0].coords_lat, cameraFocusPois[0].coords_lng),
    )
    cameraFocusPois.forEach(p => bounds.extend(new window.naver.maps.LatLng(p.coords_lat, p.coords_lng)))
    mapRef.current.fitBounds(bounds)
  }, [mapReady, cameraFocusPois])

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
    resizeObserverRef.current?.disconnect()
    // Naver's destroy() removes the map's DOM + all its own listeners
    // (click/zoom_changed/idle registered in initMap) in one call — those
    // three were previously never explicitly detached, relying on the map
    // object being dropped for GC instead. Marker/overlay teardown above
    // stays as-is (cheap, and not guaranteed redundant with destroy()).
    mapRef.current?.destroy?.()
    mapRef.current = null
  }, [])

  function zoomIn()  { mapRef.current?.setZoom(Math.min(mapRef.current.getZoom() + 1, 18)) }
  function zoomOut() { mapRef.current?.setZoom(Math.max(mapRef.current.getZoom() - 1, 6)) }

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
        className="w-full h-full naver-map-dark cursor-grab"
        role="application"
        aria-label={t('ariaLabel')}
      />

      {/* Screen-reader announcement on POI selection — pin tap or LeftPanel,
          both set selectedPoiId the same way. See DEC-22 note above. */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedPoi ? getDisplayName(selectedPoi) : ''}
      </div>

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

      {/* Empty-viewport state — ambient browsing only (restrictToPois is a
          different, exclusive-set context, not "nothing here"). Gated on
          !poisLoading so it doesn't flash during the in-flight fetch. */}
      {mapReady && !scriptErr && !poisLoading && !restrictToPois && pois.length === 0 && (
        <div className="absolute inset-0 flex items-end sm:items-center justify-center pointer-events-none px-sp-4 pb-sp-6 sm:pb-0">
          <div
            className="pointer-events-auto flex flex-col items-center gap-sp-2 text-center px-sp-6 py-sp-4"
            style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--bdr)' }}
          >
            <MapPinOff size={20} strokeWidth={2} className="text-muted" aria-hidden="true" />
            <p className="text-fg text-sm font-semibold">{t('empty.title')}</p>
            {zoom > 6 && (
              <button onClick={zoomOut} className="text-lav-map text-sm hover:underline min-h-touch flex items-center">
                {t('zoomOut')}
              </button>
            )}
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
