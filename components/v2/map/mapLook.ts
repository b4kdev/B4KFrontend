/* eslint-disable @typescript-eslint/no-explicit-any -- the Naver Maps SDK ships without types (as in V2MapCanvas.tsx) */

// The B4K map look, drawn over the published Naver base style on the vector (GL) map: land, water,
// parks, buildings and roads in the B4K greys; most Naver place labels hidden; the place icons that
// stay are quieter; district and street names in the B4K text colors, place names in Naver's.
//
// It goes through the vector map's drawing engine (map.getMapbox(), also map._mapModel.mapbox),
// which Naver does not document. When that is missing or changes, nothing here runs (every call is
// guarded) and the map keeps the plain published style. Layer ids are Naver's own names.

type Look = {
  land: string
  building: string
  park: string
  water: string
  minorRoad: string
  majorRoad: string
  casing: string
  districtName: string
  streetName: string
}

// The engine takes hex values. Light: land, buildings and casing are neutral-100, -200, -300,
// roads neutral-white, district names neutral-950, street names neutral-600; dark district names
// are neutral-50. The rest are map-only greys with no token. Text halos use the land color.
export const MAP_LOOK: Record<'light' | 'dark', Look> = {
  light: { land: '#f5f5f3', building: '#ebebe7', park: '#e2e8dc', water: '#d3dde4', minorRoad: '#ffffff', majorRoad: '#ffffff', casing: '#c4c4c1', districtName: '#0a0a0a', streetName: '#575756' },
  dark: { land: '#141414', building: '#1e1e1e', park: '#191d1a', water: '#101c26', minorRoad: '#2a2a2a', majorRoad: '#4a4a4a', casing: '#0a0a0a', districtName: '#f7f6f3', streetName: '#b4b4b2' },
}

// Label layers that stay: district names, subway stations and exits, street names, landmarks,
// tourist sights, shopping and bank brands, neighbourhood names, parks and bus stops.
const SHOWN = /행정지명|지하철역_(고배율|저배율|환승선)|지하철출구번호|LABELPATH|POI_Landmark|POI\/관광$|쇼핑편의_CI|은행_CI|마을거리부락|POI\/공원$|버스정류장/
// The general place layer keeps only coffee chains and these place types.
const GENERAL = /일반POI통합/
const KEEP_TYPES = ['culture', 'religion', 'parking_lot']
const CHAINS = ['스타벅스', '투썸플레이스', '이디야', '메가MGC', '컴포즈', '빽다방', '폴바셋', '블루보틀', '할리스', '커피빈', '파스쿠찌', '엔제리너스', '탐앤탐스', '공차', '블루샥', '커피빈앤티리프']
// The Korean name, whatever the map's label language (the features carry it in every language).
const KO_NAME = ['to-string', ['coalesce', ['get', 'name_dp:ko'], ['get', 'name_dp']]]
const GENERAL_FILTER = [
  'any',
  ['all', ['==', ['get', 'icon_type'], 'cafe'], ['any', ...CHAINS.map((c) => ['in', c, KO_NAME])]],
  ['in', ['get', 'icon_type'], ['literal', KEEP_TYPES]],
]
const ICON_OPACITY = 0.55

function engineOf(map: any): any {
  try {
    const m = typeof map?.getMapbox === 'function' ? map.getMapbox() : map?._mapModel?.mapbox
    return m && ['getStyle', 'setPaintProperty', 'setLayoutProperty', 'setFilter', 'on'].every((k) => typeof m[k] === 'function') ? m : null
  } catch {
    return null
  }
}

// Sets fixed values only, so running it again gives the same map.
function apply(m: any, P: Look) {
  let layers: { id: string; type: string }[] = []
  try {
    layers = m.getStyle()?.layers ?? []
  } catch {
    return
  }
  // One failing layer does not stop the rest.
  const run = (f: () => void) => {
    try {
      f()
    } catch {}
  }
  const paint = (id: string, key: string, value: unknown) => run(() => m.setPaintProperty(id, key, value))
  for (const { id, type } of layers) {
    if (type === 'background') {
      paint(id, 'background-color', P.land)
      continue
    }
    if (type === 'symbol') {
      const general = GENERAL.test(id)
      if (!general && !SHOWN.test(id)) {
        run(() => m.setLayoutProperty(id, 'visibility', 'none'))
        continue
      }
      if (general) run(() => m.setFilter(id, GENERAL_FILTER))
      if (/행정지명|LABELPATH/.test(id)) {
        paint(id, 'text-color', /LABELPATH/.test(id) ? P.streetName : P.districtName)
        paint(id, 'text-halo-color', P.land)
      }
      // Subway icons keep their line colors at full strength.
      if (!/지하철/.test(id)) paint(id, 'icon-opacity', ICON_OPACITY)
      continue
    }
    // Subway lines keep Naver's colors.
    if (/한국지하철/.test(id)) continue
    const bg = /_bg|\| ?bg$/.test(id)
    const major = /주요도로|고속|대로|대교|입체/.test(id)
    const color = /바다|수계|하천|수상/.test(id)
      ? P.water
      : /녹지|단지\/공원|골프장|스포츠시설/.test(id)
        ? P.park
        : /건물/.test(id)
          ? bg ? null : P.building
          : /도로실폭|도로실선|도로시설|교량|입체라인/.test(id)
            ? bg ? P.casing : major ? P.majorRoad : P.minorRoad
            : /단지|등고/.test(id)
              ? bg ? null : P.land
              : null
    if (color && (type === 'fill' || type === 'line')) paint(id, type === 'fill' ? 'fill-color' : 'line-color', color)
  }
}

const kept = new WeakSet<object>()

/** Draws the look on a vector map now (once its style is in) and again whenever its style loads again. */
export function keepMapLook(map: any, tone: 'light' | 'dark') {
  const m = engineOf(map)
  if (!m || kept.has(m)) return
  kept.add(m)
  const P = MAP_LOOK[tone]
  try {
    m.on('style.load', () => apply(m, P))
  } catch {}
  // A style still loading has no layers yet; its style.load above draws the look then.
  apply(m, P)
}
