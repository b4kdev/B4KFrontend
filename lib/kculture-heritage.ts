// DEC-61 — 유네스코 유산 (UNESCO heritage) detail page data, "Gyeongbuk" example
// (경북 유네스코 유산 15곳 — Gyeongbuk has the most UNESCO sites nationally per the
// deck, 53 total, but only 1 is publish-ready today). Self-contained, mirrors
// lib/kpop-footsteps.ts's pattern.
import 'server-only'
import { bffFetch } from './bff'
import { getRelationLabel } from './content-relation-labels'

export interface HeritagePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  /** Seed data: 'gyeongju'|'andong'|'yeongju'|'other' invented bucket. Real API data: the
   *  raw core.poi_context.relation value. Free string so both sources fit one field. */
  poi_type: string
  relationship_ko: string
  relationship_en: string
  coords_lat: number
  coords_lng: number
  verified?: boolean
}

export interface HeritageDetail {
  region: string
  regionNameEn: string
  regionNameKo: string
  totalCount: number
  items: HeritagePoi[]
  /** The real collection's own editorial title (e.g. "신라 왕처럼 경주에서 하루 —
   *  1천년 역사를 걷는 여행"), shown as a byline under the h1 so the page's headcopy
   *  reflects what the linked entity_type='collection' row is actually titled, not
   *  just its short region scope. undefined on the seed data path. */
  collectionTitle?: string
}

// Dosan Seowon is a real, well-known public UNESCO site (Confucian academy,
// Andong) — high real-world confidence in its coordinates, same judgment call as
// K-Drama's Hwahongmun Gate. Every other named site here is a real UNESCO
// heritage site too, but the deck itself flags them "검수 대기" (pending review)
// — ships placeholder pending BLK-37, not because their existence is in doubt,
// but because this codebase has no confirmed core.poi row for them yet.
const SEED_HERITAGE: Record<string, HeritageDetail> = {
  gyeongbuk: {
    region: 'gyeongbuk',
    regionNameEn: 'Gyeongsangbuk-do',
    regionNameKo: '경상북도',
    totalCount: 15,
    items: [
      {
        poi_id: 'KC-DOSANSEOWON', name_ko: '도산서원', name_en: 'Dosan Seowon',
        primary_image_url: null, display_region: 'Andong, Gyeongbuk', poi_type: 'andong',
        relationship_ko: '한국의 서원 · 2019년 유네스코 등재',
        relationship_en: "Seowon of Korea — UNESCO-listed in 2019",
        coords_lat: 36.5843, coords_lng: 128.7809,
      },
      {
        poi_id: 'KC-PLACEHOLDER-BULGUKSA', name_ko: '경주 불국사', name_en: 'Gyeongju Bulguksa',
        primary_image_url: null, display_region: 'Gyeongju, Gyeongbuk', poi_type: 'gyeongju',
        relationship_ko: '1995년 유네스코 등재 · 검수 대기',
        relationship_en: 'UNESCO-listed in 1995 — pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-SEOKGURAM', name_ko: '석굴암', name_en: 'Seokguram Grotto',
        primary_image_url: null, display_region: 'Gyeongju, Gyeongbuk', poi_type: 'gyeongju',
        relationship_ko: '1995년 유네스코 등재 · 검수 대기',
        relationship_en: 'UNESCO-listed in 1995 — pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-CHEOMSEONGDAE', name_ko: '첨성대', name_en: 'Cheomseongdae',
        primary_image_url: null, display_region: 'Gyeongju, Gyeongbuk', poi_type: 'gyeongju',
        relationship_ko: '검수 대기', relationship_en: 'Pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-HAHOEVILLAGE', name_ko: '안동 하회마을', name_en: 'Andong Hahoe Village',
        primary_image_url: null, display_region: 'Andong, Gyeongbuk', poi_type: 'andong',
        relationship_ko: '역사마을 · 검수 대기',
        relationship_en: 'Historic village — pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-BYEONGSANSEOWON', name_ko: '병산서원', name_en: 'Byeongsan Seowon',
        primary_image_url: null, display_region: 'Andong, Gyeongbuk', poi_type: 'andong',
        relationship_ko: '한국의 서원 · 검수 대기',
        relationship_en: 'Seowon of Korea — pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-BUSEOKSA', name_ko: '영주 부석사', name_en: 'Yeongju Buseoksa',
        primary_image_url: null, display_region: 'Yeongju, Gyeongbuk', poi_type: 'yeongju',
        relationship_ko: '2011년 산사 등재 · 검수 대기',
        relationship_en: "UNESCO 'Sansa, Buddhist Mountain Monasteries' listing (2011) — pending review",
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KC-PLACEHOLDER-SOSUSEOWON', name_ko: '소수서원', name_en: 'Sosu Seowon',
        primary_image_url: null, display_region: 'Yeongju, Gyeongbuk', poi_type: 'yeongju',
        relationship_ko: '한국의 서원 · 검수 대기',
        relationship_en: 'Seowon of Korea — pending review',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
    ],
  },
}

export function getHeritageDetail(region: string, includeUnverified: boolean): HeritageDetail | null {
  const detail = SEED_HERITAGE[region]
  if (!detail) return null
  return {
    ...detail,
    items: detail.items.filter(poi => includeUnverified || poi.verified !== false),
  }
}

// region -> core.entities row backing real data. 2026-08-29: list_entities/PostgREST
// schema cache fixed (was broken 2026-08-27) — searched all 108 entity_type='collection'
// rows via GET /entities?type=collection, matched by POI overlap against
// SEED_HERITAGE.gyeongbuk's placeholder names. entity 576 "신라 왕처럼 경주에서 하루 —
// 1천년 역사를 걷는 여행" (slide-kculture-c142-121) contains Bulguksa Temple and
// Cheomseongdae Observatory — name matches. Note: this collection is Gyeongju-city-only
// (5 items), not the full Gyeongsangbuk-do the seed's "gyeongbuk" key implies — no
// Andong/Yeongju (Dosan Seowon, Buseoksa) collection exists among the 108. Mapped under
// the same 'gyeongbuk' key since it's the closest real match; not an exact scope match.
const REGION_ENTITY_MAP: Record<string, { slug: string; entityId: number }> = {
  gyeongbuk: { slug: 'slide-kculture-c142-121', entityId: 576 },
}

// Short, accurate scope label for the h1/breadcrumb — deliberately NOT the collection's
// own name_ko (a full editorial sentence, not a place name; see collectionTitle below for
// that). Keyed by the same region slug as REGION_ENTITY_MAP, reflecting what the mapped
// entity's POIs actually cover (entity 576 = Gyeongju city only), not the broader
// "gyeongbuk" URL segment/seed framing (full Gyeongsangbuk-do).
const REGION_DISPLAY_NAME: Record<string, { ko: string; en: string }> = {
  gyeongbuk: { ko: '경주', en: 'Gyeongju' },
}

interface EntityProfile {
  name_ko: string
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

async function fetchRealHeritage(region: string, includeUnverified: boolean): Promise<HeritageDetail | null> {
  const mapping = REGION_ENTITY_MAP[region]
  if (!mapping) return null
  try {
    const [profile, context] = await Promise.all([
      bffFetch<EntityProfile>(`/entities/${mapping.slug}`, { token: null }),
      bffFetch<ContextItem[]>(`/context/entity:${mapping.entityId}?limit=50`, { token: null }),
    ])
    if (!context.length) return null

    const items: HeritagePoi[] = context.map(c => ({
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

    const display = REGION_DISPLAY_NAME[region] ?? { ko: region, en: region }
    return {
      region,
      regionNameEn: display.en,
      regionNameKo: display.ko,
      totalCount: items.length,
      items: includeUnverified ? items : items.filter(i => i.verified !== false),
      collectionTitle: profile.name_ko,
    }
  } catch {
    return null
  }
}

/** Route entrypoint — tries real BFF data first, falls back to seed. */
export async function resolveHeritageDetail(region: string, includeUnverified: boolean): Promise<HeritageDetail | null> {
  const real = await fetchRealHeritage(region, includeUnverified)
  if (real) return real
  return getHeritageDetail(region, includeUnverified)
}
