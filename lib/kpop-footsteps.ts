// CT_KP_EXT (DEC-60) — 멤버 발자취 (member footsteps) detail page data. Self-contained:
// deliberately doesn't import from app/api/explore/[category]/route.ts — different
// response shape (poi_type classification, relationship text, doc-given total/type
// counts independent of how many item rows actually exist), not worth forcing into
// the shared hub type. Lives outside app/api/ because Next.js route.ts files only
// allow HTTP-verb handlers + type exports — a plain helper function here would fail
// the build ("not a valid Route export field").
import 'server-only'
import { bffFetch } from './bff'
import { getRelationLabel } from './content-relation-labels'

export interface FootstepsPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  /** Seed data: 'museum'|'park'|'cafe' invented bucket. Real API data: the raw
   *  `core.poi_context.relation` value (e.g. 'concert_venue', 'mv_location') — see
   *  RELATION_LABELS. Kept as a free string so both sources fit one field. */
  poi_type: string
  /** Plain seed text (same convention as ExploreHeroSlide.subtitle) for seed rows.
   *  For real API rows this is the humanized relation label, not a narrative sentence
   *  — the BFF's /context/:key endpoint doesn't return descriptive relationship text. */
  relationship_ko: string
  relationship_en: string
  coords_lat: number
  coords_lng: number
  /** false = no confirmed core.poi row (BLK-36) — stripped from real responses. */
  verified?: boolean
}

export interface FootstepsDetail {
  teamId: string
  teamNameEn: string
  teamNameKo: string
  agencyName: string
  memberName: string
  /** Doc-given totals — independent of `items.length` (most of the 31 aren't seeded yet). */
  totalCount: number
  typeCounts: Record<string, number>
  items: FootstepsPoi[]
}

// teamId -> core.entities row backing real data. Only teams actually linked from the UI
// (KpopArtistNav's memberFootsteps CTA) belong here — confirmed 2026-08-27 via SQL run by
// product owner + live curl against GET /entities/:slug and GET /context/entity:<id>.
// entity_id 1 = BTS (group level) — entity_id 39 (RM, the member the page is framed around)
// returns zero rows from /context/entity:39, group-level is what actually has data.
const TEAM_ENTITY_MAP: Record<string, { slug: string; entityId: number }> = {
  bts: { slug: 'kpop-bts', entityId: 1 },
}

interface EntityProfile {
  name_en: string
  name_ko: string
  metadata?: { company?: string }
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

/** Real-data path: GET /entities/:slug for the profile, GET /context/entity:<id> for the
 *  related-places list (API-USAGE.md's documented two-call pattern). Returns null on any
 *  failure or empty result so the caller can fall back to seed data. */
async function fetchRealFootsteps(teamId: string, includeUnverified: boolean): Promise<FootstepsDetail | null> {
  const mapping = TEAM_ENTITY_MAP[teamId]
  if (!mapping) return null
  try {
    const [profile, context] = await Promise.all([
      bffFetch<EntityProfile>(`/entities/${mapping.slug}`, { token: null }),
      bffFetch<ContextItem[]>(`/context/entity:${mapping.entityId}?limit=50`, { token: null }),
    ])
    if (!context.length) return null

    const items: FootstepsPoi[] = context.map(c => {
      const label = getRelationLabel(c.relation, 'ko')
      const labelEn = getRelationLabel(c.relation, 'en')
      return {
        poi_id: String(c.poi_id),
        name_ko: c.name_ko,
        name_en: c.base_translations?.en?.name ?? c.name_ko,
        primary_image_url: c.primary_image_url,
        display_region: c.display_region ?? '',
        poi_type: c.relation,
        relationship_ko: label,
        relationship_en: labelEn,
        coords_lat: c.coords_lat,
        coords_lng: c.coords_lng,
        verified: true,
      }
    })

    const typeCounts: Record<string, number> = {}
    for (const item of items) typeCounts[item.poi_type] = (typeCounts[item.poi_type] ?? 0) + 1

    return {
      teamId,
      teamNameEn: profile.name_en,
      teamNameKo: profile.name_ko,
      agencyName: profile.metadata?.company ?? '',
      memberName: profile.name_en,
      totalCount: items.length,
      typeCounts,
      items: includeUnverified ? items : items.filter(i => i.verified !== false),
    }
  } catch {
    return null
  }
}

// 5 reused verbatim from `memberFootsteps` in app/api/explore/[category]/route.ts (same
// real place, don't fork the record) + 4 new — the 9 named places in the content plan's
// source doc. Only Leeum has a confirmed core.poi row; the other 8 are BLK-36 placeholders.
const SEED_FOOTSTEPS: Record<string, FootstepsDetail> = {
  bts: {
    teamId: 'bts',
    teamNameEn: 'BTS',
    teamNameKo: '방탄소년단',
    agencyName: 'HYBE',
    memberName: 'RM',
    totalCount: 31,
    typeCounts: { museum: 9, park: 7, cafe: 5 },
    items: [
      {
        poi_id: 'KP-014', name_ko: '리움미술관', name_en: 'Leeum Museum of Art',
        primary_image_url: '/images/explore/kpop/KP-014_leeum-samsung-museum.png',
        display_region: 'Yongsan-gu, Seoul', poi_type: 'museum',
        relationship_ko: 'RM의 미술관 방문지로 KTO 공식 아트 투어 코스에 포함',
        relationship_en: "RM's museum visit — featured on KTO's official art tour course",
        coords_lat: 37.53833657002706, coords_lng: 126.9991174495516,
      },
      {
        poi_id: 'KP-PLACEHOLDER-GANAART', name_ko: '가나아트센터', name_en: 'Gana Art Center',
        primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'museum',
        relationship_ko: 'KTO 공식 RM 아트 투어 코스에 포함된 갤러리',
        relationship_en: "A gallery included on KTO's official RM art tour course",
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-PKM', name_ko: 'PKM갤러리', name_en: 'PKM Gallery',
        primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'museum',
        relationship_ko: 'RM이 방문한 현대미술 갤러리',
        relationship_en: 'A contemporary art gallery RM visited',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-BUKSEOULMOA', name_ko: '북서울미술관', name_en: 'Buk-Seoul Museum of Art',
        primary_image_url: null, display_region: 'Nowon-gu, Seoul', poi_type: 'museum',
        relationship_ko: '미술 애호가 RM이 방문한 서울 미술관',
        relationship_en: 'A Seoul museum visited by art lover RM',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-HOAM', name_ko: '호암미술관', name_en: 'Hoam Museum',
        primary_image_url: null, display_region: 'Yongin, Gyeonggi', poi_type: 'museum',
        relationship_ko: '2024년 몽골미술 전시회 관람하고 SNS에 사진 공유한 미술관',
        relationship_en: 'Visited the 2024 Mongolian art exhibition here and shared photos on SNS',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-CHANGUCCHIN', name_ko: '장욱진 가옥', name_en: 'Old House of Chang Ucchin',
        primary_image_url: null, display_region: 'Yangju, Gyeonggi', poi_type: 'museum',
        relationship_ko: '장욱진 화백의 옛집',
        relationship_en: 'The former home of painter Chang Ucchin',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-SEOULFOREST', name_ko: '서울숲', name_en: 'Seoul Forest',
        primary_image_url: null, display_region: 'Seongdong-gu, Seoul', poi_type: 'park',
        relationship_ko: 'RM을 기념해 팬들이 조성한 벤치와 정원',
        relationship_en: "A bench and garden fans created in RM's honor",
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-BUSANMUSEUM', name_ko: '부산시립미술관', name_en: 'Busan Museum',
        primary_image_url: null, display_region: 'Busan', poi_type: 'museum',
        relationship_ko: 'RM이 방문한 부산 미술관 · KTO 소개',
        relationship_en: 'A Busan museum RM visited — featured by KTO',
        coords_lat: 0, coords_lng: 0, verified: false,
      },
      {
        poi_id: 'KP-PLACEHOLDER-SEOKCHONLAKE', name_ko: '석촌호수', name_en: 'Seokchon Lake',
        primary_image_url: null, display_region: 'Songpa-gu, Seoul', poi_type: 'park',
        relationship_ko: 'RM이 공식 SNS에 사진을 게시한 장소',
        relationship_en: "A place RM posted photos of on his official SNS",
        coords_lat: 0, coords_lng: 0, verified: false,
      },
    ],
  },
}

export function getFootstepsDetail(teamId: string, includeUnverified: boolean): FootstepsDetail | null {
  const detail = SEED_FOOTSTEPS[teamId]
  if (!detail) return null
  return {
    ...detail,
    items: detail.items.filter(poi => includeUnverified || poi.verified !== false),
  }
}

/** Route entrypoint — tries real BFF data first, falls back to seed. */
export async function resolveFootstepsDetail(teamId: string, includeUnverified: boolean): Promise<FootstepsDetail | null> {
  const real = await fetchRealFootsteps(teamId, includeUnverified)
  if (real) return real
  return getFootstepsDetail(teamId, includeUnverified)
}
