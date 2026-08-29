// DEC-61 — 미슐랭이 뽑은 면 요리 20곳 (Michelin-picked noodle dishes). The content
// plan flags this as its own "오늘 발행 가능한 유일한 컬렉션" (today's only fully
// publishable K-Food collection) — that claim is about the deck's own internal
// data (real English names + coordinates on ITS side), not something confirmed
// in this codebase's core.poi table. Only 9 of 20 are named in the source deck;
// none have a confirmed core.poi row here, so all 9 ship verified:false pending
// BLK-37, same as every other placeholder in this pass. Fixed slug, badge-scoped
// like K-Beauty's perfume-flagships.
import 'server-only'
import { bffFetch } from './bff'
import { getRelationLabel } from './content-relation-labels'

export interface MichelinNoodlePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  /** Seed data: 'naengmyeon'|'other' invented bucket. Real API data: the raw
   *  core.poi_context.relation value. Free string so both sources fit one field. */
  poi_type: string
  relationship_ko: string
  relationship_en: string
  coords_lat: number
  coords_lng: number
  verified?: boolean
}

// Real, from the deck's own subtitle ("면 요리 20곳"). Only 9 of 20 are named in
// the source deck — the rest aren't fabricated here, same "ship what's named,
// flag the rest" pattern as every other detail page this pass.
export const MICHELIN_NOODLES_TOTAL = 20

export const SEED_MICHELIN_NOODLES: MichelinNoodlePoi[] = [
  {
    poi_id: 'KF-PLACEHOLDER-WOOLAEOAK2', name_ko: '우래옥', name_en: 'Woo Lae Oak',
    primary_image_url: null, display_region: 'Jung-gu, Seoul', poi_type: 'naengmyeon',
    relationship_ko: '3관왕 · 서울 냉면 명가', relationship_en: 'Triple-badged — a Seoul naengmyeon institution',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-PILDONGMYEONOK', name_ko: '필동면옥', name_en: 'Pildong Myeonok',
    primary_image_url: null, display_region: 'Jung-gu, Seoul', poi_type: 'naengmyeon',
    relationship_ko: '냉면 명가', relationship_en: 'Naengmyeon institution',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-JEONGMYEON', name_ko: '정면', name_en: 'Jeongmyeon',
    primary_image_url: null, display_region: 'Gwangjin-gu, Seoul', poi_type: 'naengmyeon',
    relationship_ko: '미슐랭 가이드 등재', relationship_en: 'Michelin Guide listed',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-KYODAIYA', name_ko: '교다이야', name_en: 'Kyodaiya',
    primary_image_url: null, display_region: 'Mapo-gu, Seoul', poi_type: 'other',
    relationship_ko: '미슐랭 가이드 등재', relationship_en: 'Michelin Guide listed',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-SAMCHEONGDONGSUJEBI', name_ko: '삼청동수제비', name_en: 'Samcheongdong Sujebi',
    primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'other',
    relationship_ko: '수제비 명가', relationship_en: 'Sujebi (hand-torn noodle soup) institution',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-MOEMILJIP', name_ko: '뫼밀집', name_en: 'Moemiljip',
    primary_image_url: null, display_region: 'Haeundae-gu, Busan', poi_type: 'naengmyeon',
    relationship_ko: '밀면 명가', relationship_en: 'Milmyeon (Busan wheat noodle) institution',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-HWANGSAENGGA', name_ko: '황생가', name_en: 'Hwangsaengga',
    primary_image_url: null, display_region: 'Seoul', poi_type: 'other',
    relationship_ko: '미슐랭 가이드 등재', relationship_en: 'Michelin Guide listed',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-SOBAKKEORLSUZU', name_ko: '소박꼴 수주', name_en: 'Sobakkeorl Suzu',
    primary_image_url: null, display_region: 'Jung-gu, Seoul', poi_type: 'other',
    relationship_ko: '미슐랭 가이드 등재', relationship_en: 'Michelin Guide listed',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KF-PLACEHOLDER-100PYEONGNAENG', name_ko: '100.1 평냉', name_en: '100.1 Pyeongnaeng',
    primary_image_url: null, display_region: 'Suyeong-gu, Busan', poi_type: 'naengmyeon',
    relationship_ko: '평양냉면 전문', relationship_en: 'Pyongyang-style naengmyeon specialist',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
]

export function getMichelinNoodles(includeUnverified: boolean): MichelinNoodlePoi[] {
  return SEED_MICHELIN_NOODLES.filter(poi => includeUnverified || poi.verified !== false)
}

// core.entities row backing real data. 2026-08-29: list_entities/PostgREST schema cache
// fixed (was broken 2026-08-27) — searched all 108 entity_type='collection' rows via
// GET /entities?type=collection, matched by POI overlap against SEED_MICHELIN_NOODLES'
// placeholder names. entity 474 "냉면 한 그릇 때문에 간다 — 서울 냉면 성지순례"
// (slide-kfood-101) contains 우래옥/Woo Lae Oak and 필동면옥/Pildong Myeonok — exact
// name matches. Note: this collection is naengmyeon-specific (5 items, all naengmyeon
// restaurants), not the broader "미슐랭이 뽑은 면 요리 20곳" (Michelin-picked noodle
// dishes generally) the seed's framing implies — no Michelin-badged or non-naengmyeon
// noodle collection exists among the 108. Closest real match; not an exact scope match.
const MICHELIN_NOODLES_ENTITY: { slug: string; entityId: number } | null = { slug: 'slide-kfood-101', entityId: 474 }

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

async function fetchRealMichelinNoodles(includeUnverified: boolean): Promise<MichelinNoodlePoi[] | null> {
  if (!MICHELIN_NOODLES_ENTITY) return null
  try {
    const context = await bffFetch<ContextItem[]>(`/context/entity:${MICHELIN_NOODLES_ENTITY.entityId}?limit=50`, { token: null })
    if (!context.length) return null

    const items: MichelinNoodlePoi[] = context.map(c => ({
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

    return includeUnverified ? items : items.filter(i => i.verified !== false)
  } catch {
    return null
  }
}

/** Route entrypoint — tries real BFF data first, falls back to seed. Returns
 *  {totalCount, items} directly (this page has no wrapping *Detail type). */
export async function resolveMichelinNoodles(includeUnverified: boolean): Promise<{ totalCount: number; items: MichelinNoodlePoi[] }> {
  const real = await fetchRealMichelinNoodles(includeUnverified)
  if (real) return { totalCount: real.length, items: real }
  return { totalCount: MICHELIN_NOODLES_TOTAL, items: getMichelinNoodles(includeUnverified) }
}
