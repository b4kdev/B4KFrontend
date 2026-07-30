// DEC-61 — 유네스코 유산 (UNESCO heritage) detail page data, "Gyeongbuk" example
// (경북 유네스코 유산 15곳 — Gyeongbuk has the most UNESCO sites nationally per the
// deck, 53 total, but only 1 is publish-ready today). Self-contained, mirrors
// lib/kpop-footsteps.ts's pattern.

export interface HeritagePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  poi_type: 'gyeongju' | 'andong' | 'yeongju' | 'other'
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
