// DEC-61 — 촬영지 (filming spots) detail page data, "Tangerines" (폭싹 속았수다) example.
// Self-contained, mirrors lib/kpop-footsteps.ts's pattern (own seed, own gate, no
// cross-import from app/api/explore/[category]/route.ts).

export interface FilmingSpotPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  poi_type: 'nature' | 'historic' | 'experience'
  relationship_ko: string
  relationship_en: string
  coords_lat: number
  coords_lng: number
  verified?: boolean
}

export interface FilmingSpotsDetail {
  workId: string
  workNameEn: string
  workNameKo: string
  broadcaster: string
  /** Real, from the deck's own subtitle ("제주 촬영지 24곳"). Sub-type counts aren't
   * individually confirmed in the source deck, so only this total is shown as a count
   * — the type chips below are plain category labels, not claimed counts. */
  totalCount: number
  items: FilmingSpotPoi[]
}

const SEED_FILMING_SPOTS: Record<string, FilmingSpotsDetail> = {
  tangerines: {
    workId: 'tangerines',
    workNameEn: 'Tangerines',
    workNameKo: '폭싹 속았수다',
    broadcaster: 'Netflix',
    totalCount: 24,
    items: [
      {
        poi_id: 'KD-SEONGSAN-ILCHULBONG', name_ko: '성산일출봉', name_en: 'Seongsan Ilchulbong',
        primary_image_url: null, display_region: 'Seogwipo, Jeju', poi_type: 'nature',
        relationship_ko: '작품 재조명 관련지 · 촬영지',
        relationship_en: 'Featured filming location, re-highlighted by the show',
        coords_lat: 33.4587, coords_lng: 126.9425,
      },
      {
        poi_id: 'KD-PLACEHOLDER-SEONGEUP', name_ko: '성읍민속마을', name_en: 'Seongeup Folk Village',
        primary_image_url: null, display_region: 'Seogwipo, Jeju', poi_type: 'historic',
        relationship_ko: '전통가옥 관련지',
        relationship_en: 'Traditional-house filming location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-GIMNYEONGFISHING', name_ko: '김녕 해녀', name_en: 'Gimnyeong Fishing',
        primary_image_url: null, display_region: 'Jeju', poi_type: 'experience',
        relationship_ko: '해녀 관련지',
        relationship_en: 'Haenyeo (women diver) related location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-SEONGSANCANOLA', name_ko: '성산 유채꽃밭', name_en: 'Seongsan Canola',
        primary_image_url: null, display_region: 'Seogwipo, Jeju', poi_type: 'nature',
        relationship_ko: '봄철 배경지',
        relationship_en: 'Spring-season backdrop location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-GWANDEOKJEONG', name_ko: '관덕정', name_en: 'Gwandeokjeong',
        primary_image_url: null, display_region: 'Jeju-si, Jeju', poi_type: 'historic',
        relationship_ko: '역사 배경지',
        relationship_en: 'Historic backdrop location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-GIMNYEONGBEACH2', name_ko: '김녕해변', name_en: 'Gimnyeong Beach',
        primary_image_url: null, display_region: 'Jeju', poi_type: 'nature',
        relationship_ko: '해변 배경지',
        relationship_en: 'Beach backdrop location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-JEJUMOKGWANA', name_ko: '제주목관아', name_en: 'Jeju Mokgwana',
        primary_image_url: null, display_region: 'Jeju-si, Jeju', poi_type: 'historic',
        relationship_ko: '조선시대 관아 유적 배경지',
        relationship_en: 'Joseon-era government office site backdrop',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-HAENYEOMUSEUM', name_ko: '해녀박물관', name_en: 'Jeju Haenyeo Museum',
        primary_image_url: null, display_region: 'Jeju', poi_type: 'experience',
        relationship_ko: '해녀 문화 전시 관련지',
        relationship_en: 'Haenyeo culture exhibit, related location',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KD-PLACEHOLDER-STONEPARK', name_ko: '제주돌문화공원', name_en: 'Jeju Stone Park',
        primary_image_url: null, display_region: 'Jeju', poi_type: 'nature',
        relationship_ko: '제주 자연·문화 배경지',
        relationship_en: "Jeju's natural/cultural backdrop location",
        coords_lat: 0, coords_lng: 0, verified: false,
      },
    ],
  },
}

export function getFilmingSpotsDetail(workId: string, includeUnverified: boolean): FilmingSpotsDetail | null {
  const detail = SEED_FILMING_SPOTS[workId]
  if (!detail) return null
  return {
    ...detail,
    items: detail.items.filter(poi => includeUnverified || poi.verified !== false),
  }
}
