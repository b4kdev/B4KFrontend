// DEC-61 — 향수 플래그십 10곳 (perfume flagships), the one K-Beauty collection the
// content plan flags as fully complete (no blank cards). Fixed slug, not a dynamic
// [id] segment — this section's detail-page axis is "목적" (purpose), not a
// per-entity id like K-Drama's work or K-Pop's team.

export interface PerfumeFlagshipPoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  poi_type: 'seongsu' | 'hannam' | 'garosugil' | 'other'
  relationship_ko: string
  relationship_en: string
  coords_lat: number
  coords_lng: number
  verified?: boolean
}

// totalCount is real (deck's own "10곳 전부 발행" claim); the district-chip
// sub-breakdown shown in the deck's mock ("최신순3/성수2/한남2/가로수길2") doesn't
// cleanly sum to 10 and "최신순" reads as a sort option, not a category, so only
// the "all" total is shown as a count — sub-chips are plain labels, not claims.
export const PERFUME_FLAGSHIPS_TOTAL = 10

export const SEED_PERFUME_FLAGSHIPS: PerfumeFlagshipPoi[] = [
  // Reused from the k-beauty hub's brandFlagship row — same real place, don't fork.
  {
    poi_id: 'KB-NEW-152', name_ko: '이솝 성수', name_en: 'Aesop Seongsu',
    primary_image_url: '/images/explore/kbeauty/KB-NEW-152_aesop-seongsu.png',
    display_region: 'Seongdong-gu, Seoul', poi_type: 'seongsu',
    relationship_ko: '시그니처 향수 매장', relationship_en: 'Signature fragrance store',
    coords_lat: 37.5423129121868, coords_lng: 127.056022296655,
  },
  {
    poi_id: 'KB-NEW-144', name_ko: '논픽션 한남', name_en: 'NONFICTION Hannam',
    primary_image_url: '/images/explore/kbeauty/KB-NEW-144_nonfiction-hannam.png',
    display_region: 'Yongsan-gu, Seoul', poi_type: 'hannam',
    relationship_ko: '향수 플래그십', relationship_en: 'Perfume flagship store',
    coords_lat: 37.53625706385359, coords_lng: 127.0003428273847,
  },
  {
    poi_id: 'KB-PLACEHOLDER-NONFICTIONSEONGSU', name_ko: '논픽션 성수', name_en: 'NONFICTION Seongsu',
    primary_image_url: null, display_region: 'Seongdong-gu, Seoul', poi_type: 'seongsu',
    relationship_ko: '향수 플래그십 · 뷰티에서 유일하게 완전한 컬렉션',
    relationship_en: 'Perfume flagship — the one fully complete collection in K-Beauty',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-GRANHANDSEOCHON', name_ko: '그랑핸드 서촌', name_en: 'GRANHAND Seochon',
    primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'other',
    relationship_ko: '향수 편집샵', relationship_en: 'Fragrance select shop',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-AESOPHANNAM2', name_ko: '이솝 한남 2', name_en: 'Aesop Hannam 2',
    primary_image_url: null, display_region: 'Yongsan-gu, Seoul', poi_type: 'hannam',
    relationship_ko: '시그니처 매장', relationship_en: 'Signature store',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-AESOPGAROSUGIL', name_ko: '이솝 가로수길', name_en: 'Aesop Garosu-gil',
    primary_image_url: null, display_region: 'Gangnam-gu, Seoul', poi_type: 'garosugil',
    relationship_ko: '시그니처 매장', relationship_en: 'Signature store',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-GRANHANDBUKCHON', name_ko: '그랑핸드 북촌', name_en: 'GRANHAND Bukchon',
    primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'other',
    relationship_ko: '향수 편집샵', relationship_en: 'Fragrance select shop',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-TAMBURINSDOSAN', name_ko: '탬버린즈 도산', name_en: 'TAMBURINS Dosan',
    primary_image_url: null, display_region: 'Gangnam-gu, Seoul', poi_type: 'other',
    relationship_ko: '플래그십 스토어', relationship_en: 'Flagship store',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
  {
    poi_id: 'KB-PLACEHOLDER-NONFICTIONSAMCHEONG', name_ko: '논픽션 삼청', name_en: 'NONFICTION Samcheong',
    primary_image_url: null, display_region: 'Jongno-gu, Seoul', poi_type: 'other',
    relationship_ko: '향수 플래그십', relationship_en: 'Perfume flagship store',
    coords_lat: 0, coords_lng: 0, verified: false,
  },
]

export function getPerfumeFlagships(includeUnverified: boolean): PerfumeFlagshipPoi[] {
  return SEED_PERFUME_FLAGSHIPS.filter(poi => includeUnverified || poi.verified !== false)
}
