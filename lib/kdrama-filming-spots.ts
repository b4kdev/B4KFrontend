// DEC-61 — 촬영지 (filming spots) detail page data, "Tangerines" (폭싹 속았수다) example.
// Self-contained, mirrors lib/kpop-footsteps.ts's pattern (own seed, own gate, no
// cross-import from app/api/explore/[category]/route.ts).
import 'server-only'
import { bffFetch } from './bff'
import { getRelationLabel } from './content-relation-labels'

export interface FilmingSpotPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  /** Seed data: 'nature'|'historic'|'experience' invented bucket. Real API data: the raw
   *  core.poi_context.relation value. Free string so both sources fit one field. */
  poi_type: string
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

// workId -> core.entities row backing real data. Still empty — 2026-08-29 re-check:
// list_entities/PostgREST schema cache is now fixed (was broken 2026-08-27), so this was
// re-run for real this time — searched all 108 entity_type='collection' rows (all 20 of
// the K-Drama section) via GET /entities?type=collection&type=k-drama, none are Jeju/
// "폭싹 속았수다"/Tangerines-themed (they cover 도깨비/사랑의불시착/이태원클라쓰/etc
// instead). Not a schema-cache false negative this time — the collection genuinely
// doesn't exist yet. Same pattern as lib/kpop-footsteps.ts's TEAM_ENTITY_MAP — once it's
// added to core.entities, set it here and resolveFilmingSpotsDetail() picks it up
// automatically, no other code changes needed.
const WORK_ENTITY_MAP: Record<string, { slug: string; entityId: number }> = {}

interface EntityProfile {
  name_en: string
  name_ko: string
  metadata?: { broadcaster?: string }
}

interface ContextItem {
  poi_id: number
  name_ko: string
  relation: string
  coords_lat: number
  coords_lng: number
  primary_image_url: string | null
  display_region: string | null
  base_translations?: { en?: { name?: string } }
}

async function fetchRealFilmingSpots(workId: string, includeUnverified: boolean): Promise<FilmingSpotsDetail | null> {
  const mapping = WORK_ENTITY_MAP[workId]
  if (!mapping) return null
  try {
    const [profile, context] = await Promise.all([
      bffFetch<EntityProfile>(`/entities/${mapping.slug}`, { token: null }),
      bffFetch<ContextItem[]>(`/context/entity:${mapping.entityId}?limit=50`, { token: null }),
    ])
    if (!context.length) return null

    const items: FilmingSpotPoi[] = context.map(c => ({
      poi_id: String(c.poi_id),
      name_ko: c.name_ko,
      name_en: c.base_translations?.en?.name ?? c.name_ko,
      primary_image_url: c.primary_image_url,
      display_region: c.display_region ?? '',
      poi_type: c.relation,
      relationship_ko: getRelationLabel(c.relation, 'ko'),
      relationship_en: getRelationLabel(c.relation, 'en'),
      coords_lat: c.coords_lat,
      coords_lng: c.coords_lng,
      verified: true,
    }))

    return {
      workId,
      workNameEn: profile.name_en,
      workNameKo: profile.name_ko,
      broadcaster: profile.metadata?.broadcaster ?? '',
      totalCount: items.length,
      items: includeUnverified ? items : items.filter(i => i.verified !== false),
    }
  } catch {
    return null
  }
}

/** Route entrypoint — tries real BFF data first, falls back to seed. */
export async function resolveFilmingSpotsDetail(workId: string, includeUnverified: boolean): Promise<FilmingSpotsDetail | null> {
  const real = await fetchRealFilmingSpots(workId, includeUnverified)
  if (real) return real
  return getFilmingSpotsDetail(workId, includeUnverified)
}
