import { NextRequest, NextResponse } from 'next/server'

// CT_KP_EXT (DEC-60) — 멤버 발자취 (member footsteps) detail page data. Self-contained:
// deliberately doesn't import from ../../[category]/route.ts — different response shape
// (poi_type classification, relationship text, doc-given total/type counts independent
// of how many item rows actually exist), not worth forcing into the shared hub type.

export interface FootstepsPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  poi_type: 'museum' | 'park' | 'cafe'
  /** Plain seed text (same convention as ExploreHeroSlide.subtitle) — content data, not UI chrome. */
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
  typeCounts: { museum: number; park: number; cafe: number }
  items: FootstepsPoi[]
}

// 5 reused verbatim from `memberFootsteps` in ../../[category]/route.ts (same real place,
// don't fork the record) + 4 new — the 9 named places in the content plan's source doc.
// Only Leeum has a confirmed core.poi row; the other 8 are BLK-36 placeholders.
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

// Exported so `page.tsx`'s `generateMetadata`/server component can call this directly
// instead of doing a self-HTTP-fetch to this same route during SSR.
export function getFootstepsDetail(teamId: string, includeUnverified: boolean): FootstepsDetail | null {
  const detail = SEED_FOOTSTEPS[teamId]
  if (!detail) return null
  return {
    ...detail,
    items: detail.items.filter(poi => includeUnverified || poi.verified !== false),
  }
}

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  // Same dev-only preview gate as app/api/explore/[category]/route.ts — a no-op
  // outside development even if the query param is present.
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'

  const data = getFootstepsDetail(params.teamId, includeUnverified)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}
