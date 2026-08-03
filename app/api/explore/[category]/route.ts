import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffFetch } from '@/lib/bff'

export interface ExplorePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  quality_score: number
  is_trending: boolean
  is_partner?: boolean
  partner_url?: string | null
  /** Chip-filter facets — hub-specific. */
  agency?: string
  district?: string
  region?: string
  /** K-Drama broadcaster chip facet. */
  broadcaster?: string
  /**
   * Array-membership facet (K-Food/K-Culture badge chips — 미슐랭/레드리본/UNESCO/etc).
   * A POI can carry more than one. The special chip value 'MULTI' (기타: "2개 이상")
   * matches `badges.length >= 2` instead of array-inclusion — see `applyFacets` in GET.
   */
  badges?: string[]
  /** ISO date (YYYY-MM-DD) for D-Day countdown on event/merch/festival items. */
  event_date?: string
  /** SC-36 (KD_04/KB_04) — one featured item renders as a wide card above the row. */
  is_featured?: boolean
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
  /** CT_KP_EXT (DEC-60) — which artist tile(s) this item belongs to, e.g. ['bts']. */
  artistIds?: string[]
  /**
   * false = placeholder content (invented coords/no confirmed core.poi row) pending
   * BLK-36 — filtered out of every real response, only visible with ?includeUnverified=1
   * in non-production. Omitted (undefined) means real/confirmed, same as every existing
   * seed row above this comment.
   */
  verified?: boolean
}

/** CT_KP_EXT (DEC-60) — artist tile grid entry. Team-level only, no per-member tiles. */
export interface ExploreArtist {
  id: string
  name_ko: string
  name_en: string
  agency: string
  image_url: string | null
  /**
   * Team-level simplification: the month a member-tied seasonal row (birthday-cafe)
   * is live for this team. Real per-member granularity needs the relation BLK-35 asks
   * dev friend about — this field stands in until that exists.
   */
  birthday_month?: number
}

export interface ExploreSection {
  id: string
  items: ExplorePoi[]
}

export interface ExploreHeroSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  cta_label: string
  cta_href: string
  image_url: string | null
  /**
   * Same `verified` gate as ExplorePoi (BLK-36/BLK-37) — hero content wasn't
   * previously filtered by this at all (only sections were), which would have
   * shown unconfirmed placeholder content to real users unconditionally for any
   * hero that isn't backed by a real core.poi row (found while wiring K-Beauty's
   * and K-Food's heroes, neither of which have confirmed coordinates yet).
   */
  verified?: boolean
}

export interface ExplorePackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
  is_partner: true
}

export interface ExploreData {
  category: string
  sections: ExploreSection[]
  hero?: ExploreHeroSlide[]
  packages?: ExplorePackage[]
  /** CT_KP_EXT (DEC-60) — artist tile grid data, k-pop only. [] on other categories. */
  artists?: ExploreArtist[]
}

// BFF GET /places item (api.list_places)
interface BffPlace {
  poi_id: number
  name_ko: string
  primary_image_url: string | null
  like_count: number
  save_count: number
  coords_lat: number
  coords_lng: number
  display_region: string | null
  domains: string[] | null
  translations: Record<string, { name?: string; description?: string }> | null
}

// Section ids per category kept in sync with app/[locale]/explore/_components/ExplorePage.tsx
// CATEGORIES[].sections so headers/labels render correctly once items exist.
// Category slugs coincide with BFF domain values (k-pop | k-drama | k-beauty | k-culture).
const SECTIONS_BY_CATEGORY: Record<string, string[]> = {
  // 'agencies' renamed 'agencyHq' + 'memberFootsteps' added — CT_KP_EXT (DEC-60).
  // birthdayCafe intentionally excluded: it's conditionally rendered (see GET), not
  // a static per-category section like the rest.
  'k-pop': ['concerts', 'tours', 'agencyHq', 'merchandise', 'memberFootsteps'],
  'k-drama': ['filming', 'tours', 'historical', 'ostCafes'],
  // DEC-61 — restructured from skincare/makeup/spa/salon to the content plan's
  // real 4 rows (쇼핑·편집샵/브랜드플래그십/헤어·살롱/약국·더마). Existing real seed
  // items redistributed into whichever new row fits (see SEED_SECTIONS comment).
  'k-beauty': ['shopping', 'brandFlagship', 'salon', 'derma'],
  // DEC-61 — new 5th section. "기타" (509곳) explicitly skipped: the content plan
  // itself flags it as "로우로 못 쓰인다" (not usable as a row), not a screen gap.
  'k-food': ['noodles', 'soups', 'hanjeongsik'],
  // DEC-61 — restructured from traditional/food/festivals/crafts to the content
  // plan's real 4 rows (역사·유적/자연·경관/사찰·종교/박물관·미술관). Real items
  // redistributed, none dropped — see SEED_SECTIONS comment.
  'k-culture': ['heritage', 'nature', 'temple', 'museum'],
}

/**
 * Facet config per category — the query param(s) hub chips drive. Most sections have
 * one (or two, since the content-plan doc's K-Drama/K-Food/K-Culture hubs each need a
 * mid-tier chip AND a region chip simultaneously — see `CATEGORIES.filters` in
 * `ExplorePage.tsx`). `array: true` fields (K-Food/K-Culture's `badges`) match via
 * `.includes(value)` instead of equality; `'MULTI'` is a hardcoded special value for
 * K-Food's "2개 이상" chip (`badges.length >= 2`), not a generalized predicate.
 */
interface FacetConfig {
  param: string
  field: keyof ExplorePoi
  array?: boolean
}
const FACETS_BY_CATEGORY: Record<string, FacetConfig[]> = {
  'k-pop': [{ param: 'agency', field: 'agency' }],
  'k-drama': [{ param: 'broadcaster', field: 'broadcaster' }, { param: 'region', field: 'region' }],
  'k-beauty': [{ param: 'district', field: 'district' }],
  'k-food': [{ param: 'badge', field: 'badges', array: true }, { param: 'region', field: 'region' }],
  'k-culture': [{ param: 'badge', field: 'badges', array: true }, { param: 'region', field: 'region' }],
}

// Interim content seed for the thematic sections + hero (the BFF has no
// per-section facet yet — see comment on `base` below). Every row cross-checked
// against B4K_POI_DB_IMPORT_CLEANED_1500.xlsx (poi_id/coords are the real DB
// values). quality_score 0 / is_trending false: no real engagement signal to
// report yet, not fabricated. primary_image_url null - image host TBD, see DEC-55.
// `packages` stays [] on every category — no confirmed real partner_url to ship
// (see DEC-50). Replace with the real per-section BFF facet once it exists.
const SEED_HERO: Record<string, ExploreHeroSlide[]> = {
  // CT_KP_EXT (DEC-60) — reframed to "RM'S MUSEUM ROUTE" per the content plan's canonical
  // page mock (image 3 of the source doc), replacing the old generic KSPO Dome hero.
  'k-pop': [{ id: 'KP-014', badge: 'MEMBER ROUTE', title: "RM's Museum Route", subtitle: '용산구 이태원로 55길 60 — RM이 반복해 찾은 미술관, 그가 남긴 흔적을 따라 걷는 하루 코스.', cta_label: 'FOLLOW THE ROUTE', cta_href: '/explore/k-pop/bts/footsteps', image_url: '/images/explore/kpop/KP-014_leeum-samsung-museum.png' }],
  // DEC-61 — reframed to "TANGERINES · JEJU ROUTE" per the content plan's canonical
  // page mock (Tangerines = the English title of 폭싹 속았수다), CTA into the new
  // filming-spots detail page — replaces the old Goblin/Jumunjin Breakwater hero.
  'k-drama': [{ id: 'KD-SEONGSAN-ILCHULBONG', badge: 'TANGERINES · JEJU ROUTE', title: 'Seongsan Ilchulbong', subtitle: '제주 서귀포시 — 폭싹속았수다 해수 장면의 배경지. 촬영지 24곳이 제주에 모여 있다.', cta_label: 'SEE THE ROUTE', cta_href: '/explore/k-drama/tangerines/filming-spots', image_url: null }],
  // DEC-61 — reframed to "SEOUL SCENT ROUTE" / NONFICTION Seongsu per the content
  // plan's canonical page mock, replacing the old Olive Young shopping-hub hero.
  // verified:false — NONFICTION Seongsu has no confirmed core.poi row (BLK-37);
  // real users see no hero on k-beauty until this resolves (rather than a
  // fabricated-content hero, which the pre-fix code would have shown — hero
  // wasn't gated by `verified` at all until this pass).
  'k-beauty': [{ id: 'KB-PLACEHOLDER-NONFICTIONSEONGSU', badge: 'SEOUL SCENT ROUTE', title: 'NONFICTION Seongsu', subtitle: '성동구 연무장길 — 향수 플래그십 10곳 중 하나, 뷰티에서 유일하게 완전한 컬렉션.', cta_label: 'FOLLOW THE SCENT', cta_href: '/explore/k-beauty/perfume-flagships', image_url: null, verified: false }],
  // DEC-61 — reframed to "UNESCO WORLD HERITAGE" / Changdeokgung Palace per the
  // content plan's canonical page mock. Changdeokgung already has a confirmed
  // core.poi row (KD016-001, reused from the traditional/heritage row below) —
  // real, not placeholder, unlike k-beauty/k-food's heroes.
  'k-culture': [{ id: 'KD016-001', badge: 'UNESCO WORLD HERITAGE', title: 'Changdeokgung Palace', subtitle: '서울 종로구 율곡로 99 — 1997년 유네스코 세계유산 등재. 51곳의 유네스코 유산 중 하나.', cta_label: 'EXPLORE HERITAGE SITES', cta_href: '/explore/k-culture/gyeongbuk/heritage', image_url: '/images/home/trending/KD016-001_changdeokgung-palace.webp' }],
  // DEC-61 — new 5th section. "TRIPLE-PICKED" / Woo Lae Oak, per the content
  // plan's own named example (a restaurant all 4 of its merged badge sources agree on).
  // verified:false — same reasoning as k-beauty's hero above; Woo Lae Oak has
  // no confirmed core.poi row of its own in this codebase yet.
  'k-food': [{ id: 'KF-PLACEHOLDER-WOOLAEOAK', badge: 'TRIPLE-PICKED', title: 'Woo Lae Oak', subtitle: '중구 창경궁로 — 미슐랭·레드리본·B4K픽 4개 출처가 모두 꼽은 7곳 중 하나.', cta_label: 'SEE ALL SEVEN', cta_href: '/explore/k-food/michelin-noodles', image_url: null, verified: false }],
}

// CT_KP_EXT (DEC-60) — artist tile grid roster. Real, publicly-known groups (not
// fabricated business data) — but which ~23 of ~40 teams are default-shown, and the
// exact default/reveal ordering, is the content collaborator's curation call and
// wasn't handed off with this build; this list is a representative placeholder
// spanning all 6 agencies until the real roster arrives. `birthday_month` drives the
// Trending Now auto-rotation (see GET) — left unset for every artist below: the
// content plan's "이번 달 생일카페" row doesn't name which member/month it belongs to,
// and no real BTS member has an August birthday, so guessing was wrong. Set this once
// dev friend/content plan confirms a real member+month pairing.
const SEED_ARTISTS: Record<string, ExploreArtist[]> = {
  'k-pop': [
    { id: 'bts', name_ko: '방탄소년단', name_en: 'BTS', agency: 'HYBE', image_url: null },
    { id: 'seventeen', name_ko: '세븐틴', name_en: 'SEVENTEEN', agency: 'HYBE', image_url: null },
    { id: 'txt', name_ko: '투모로우바이투게더', name_en: 'TOMORROW X TOGETHER', agency: 'HYBE', image_url: null },
    { id: 'enhypen', name_ko: '엔하이픈', name_en: 'ENHYPEN', agency: 'HYBE', image_url: null },
    { id: 'le-sserafim', name_ko: '르세라핌', name_en: 'LE SSERAFIM', agency: 'HYBE', image_url: null },
    { id: 'newjeans', name_ko: '뉴진스', name_en: 'NewJeans', agency: 'HYBE', image_url: null },
    { id: 'aespa', name_ko: '에스파', name_en: 'aespa', agency: 'SM', image_url: null },
    { id: 'nct-dream', name_ko: 'NCT 드림', name_en: 'NCT DREAM', agency: 'SM', image_url: null },
    { id: 'red-velvet', name_ko: '레드벨벳', name_en: 'Red Velvet', agency: 'SM', image_url: null },
    { id: 'exo', name_ko: '엑소', name_en: 'EXO', agency: 'SM', image_url: null },
    { id: 'riize', name_ko: '라이즈', name_en: 'RIIZE', agency: 'SM', image_url: null },
    { id: 'blackpink', name_ko: '블랙핑크', name_en: 'BLACKPINK', agency: 'YG', image_url: null },
    { id: 'treasure', name_ko: '트레저', name_en: 'TREASURE', agency: 'YG', image_url: null },
    { id: 'babymonster', name_ko: '베이비몬스터', name_en: 'BABYMONSTER', agency: 'YG', image_url: null },
    { id: 'winner', name_ko: '위너', name_en: 'WINNER', agency: 'YG', image_url: null },
    { id: 'twice', name_ko: '트와이스', name_en: 'TWICE', agency: 'JYP', image_url: null },
    { id: 'stray-kids', name_ko: '스트레이 키즈', name_en: 'Stray Kids', agency: 'JYP', image_url: null },
    { id: 'itzy', name_ko: '있지', name_en: 'ITZY', agency: 'JYP', image_url: null },
    { id: 'nmixx', name_ko: '엔믹스', name_en: 'NMIXX', agency: 'JYP', image_url: null },
    { id: 'ive', name_ko: '아이브', name_en: 'IVE', agency: 'STARSHIP', image_url: null },
    { id: 'monsta-x', name_ko: '몬스타엑스', name_en: 'MONSTA X', agency: 'STARSHIP', image_url: null },
    { id: 'ateez', name_ko: '에이티즈', name_en: 'ATEEZ', agency: 'KQ', image_url: null },
  ],
}

const SEED_SECTIONS: Record<string, Record<string, ExplorePoi[]>> = {
  'k-pop': {
    // Concerts/tours/merchandise stay UNFILTERED by artist/agency selection — no real
    // per-item artist attribution exists for these (BLK-35/BLK-36), so tagging them
    // would mean inventing the exact relation data this build is deliberately not
    // guessing at. Placeholder (verified:false) rows added below only to preview
    // SPEC-04's named examples ahead of real coordinates — filtered from real users.
    concerts: [
      { poi_id: 'KP-005', name_ko: '인스파이어 아레나', name_en: 'Inspire Arena', primary_image_url: '/images/explore/kpop/KP-005_inspire-arena.png', display_region: 'Incheon', quality_score: 0, is_trending: false, coords_lat: 37.46668401261223, coords_lng: 126.3905883002809 },
      { poi_id: 'KP-0823', name_ko: '장충체육관', name_en: 'Jangchung Arena', primary_image_url: '/images/explore/kpop/KP-0823_jangchung-arena.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.558178171371, coords_lng: 127.006808757736 },
      { poi_id: 'KP-0824', name_ko: '블루스퀘어', name_en: 'Blue Square', primary_image_url: '/images/explore/kpop/KP-0824_blue-square.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5408611480276, coords_lng: 127.002548167462 },
      { poi_id: 'KP-0864', name_ko: '고척스카이돔', name_en: 'Gocheok Sky Dome', primary_image_url: '/images/explore/kpop/KP-0864_gocheok-sky-dome.png', display_region: 'Guro-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.49821220764421, coords_lng: 126.8670889679075 },
      // Placeholder — BLK-36 (SPEC-04 names this row's 3rd example, no confirmed core.poi row)
      { poi_id: 'KP-PLACEHOLDER-OLYMPICHALL', name_ko: '올림픽홀', name_en: 'Olympic Hall', primary_image_url: null, display_region: 'Songpa-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    tours: [
      { poi_id: 'KP-014', name_ko: '리움미술관', name_en: 'Leeum Samsung Museum', primary_image_url: '/images/explore/kpop/KP-014_leeum-samsung-museum.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.53833657002706, coords_lng: 126.9991174495516 },
      { poi_id: 'KD024-004', name_ko: 'DDP 동대문디자인플라자', name_en: 'Dongdaemun Design Plaza', primary_image_url: '/images/home/editorial/KD001-019_ddp.webp', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5671843130818, coords_lng: 127.009911013917 },
      { poi_id: 'KP-067', name_ko: '경리단길', name_en: 'Gyeongridan-gil', primary_image_url: '/images/explore/kpop/KP-067_gyeongridan-gil.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5397580614249, coords_lng: 126.991721972247 },
      { poi_id: 'KP-111', name_ko: '일산호수공원', name_en: 'Ilsan Lake Park', primary_image_url: '/images/explore/kpop/KP-111_ilsan-lake-park.png', display_region: 'Goyang, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.6561360415672, coords_lng: 126.764141543966 },
      // Placeholders — BLK-36 (SPEC-04's named 투어 examples, no confirmed core.poi row)
      { poi_id: 'KP-PLACEHOLDER-GYEONGBOKGUNG', name_ko: '경복궁', name_en: 'Gyeongbokgung Palace', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-NODEUL', name_ko: '노들섬', name_en: 'Nodeul Island', primary_image_url: null, display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-EULJIRO', name_ko: '을지로', name_en: 'Euljiro', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // Renamed from 'agencies' — CT_KP_EXT reframes this as its own "덕질의 원점"
    // (origin point of the fandom) agency-HQ-pilgrimage row (기획사), a specific
    // curated 5-item set per the content plan's source doc — NOT the same as the
    // old KP_05 agencies chip-filter data (JYP Center/SM HQ/YG HQ), which is dropped
    // entirely here since it isn't part of this row's real definition. Only 3/5 are
    // named as publish-ready (HYBE HQ, Company SooSoo, INB100); the other 2 (Former
    // Big Hit, YG HQ) are explicitly held back pending coords/quality grade. None
    // have a confirmed core.poi row yet (BLK-36) — all 5 ship as placeholder, so this
    // row is empty for real users until that resolves.
    agencyHq: [
      { poi_id: 'KP-PLACEHOLDER-HYBEHQ', name_ko: '하이브 사옥', name_en: 'HYBE Headquarters', primary_image_url: null, display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, agency: 'HYBE', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-SOOSOO', name_ko: '컴퍼니수수', name_en: 'Company SooSoo', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-INB100', name_ko: 'INB100', name_en: 'INB100', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-FORMERBIGHIT', name_ko: '구 빅히트 사옥', name_en: 'Former Big Hit', primary_image_url: null, display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, agency: 'HYBE', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-YGHQ', name_ko: 'YG엔터테인먼트 사옥', name_en: 'YG HQ', primary_image_url: null, display_region: 'Mapo-gu, Seoul', quality_score: 0, is_trending: false, agency: 'YG', coords_lat: 0, coords_lng: 0, verified: false },
    ],
    merchandise: [
      { poi_id: 'KP-0250', name_ko: '더현대 서울', name_en: 'The Hyundai Seoul', primary_image_url: '/images/explore/kpop/KP-0250_the-hyundai-seoul.png', display_region: 'Yeongdeungpo-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.52587207102913, coords_lng: 126.9284461241116 },
      { poi_id: 'KP-1090', name_ko: '커먼그라운드', name_en: 'Common Ground', primary_image_url: '/images/home/new/KP-1090_common-ground.webp', display_region: 'Gwangjin-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.54105555235208, coords_lng: 127.0656686600397 },
      { poi_id: 'KP-0408', name_ko: '케이타운포유 코엑스', name_en: 'Ktown4u COEX', primary_image_url: '/images/explore/kpop/KP-0408_ktown4u-coex.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.50996877837638, coords_lng: 127.0613875508475 },
      { poi_id: 'KP-0409', name_ko: '케이타운포유 인사', name_en: 'Ktown4u Insa', primary_image_url: '/images/explore/kpop/KP-0409_ktown4u-insa.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.57446722916056, coords_lng: 126.9835517296716 },
      // Placeholders — BLK-36 (SPEC-04's named 굿즈 examples, no confirmed core.poi row)
      { poi_id: 'KP-PLACEHOLDER-LINEFRIENDS', name_ko: '라인프렌즈 스퀘어', name_en: 'LINE FRIENDS SQUARE', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-LOTTESTAR', name_ko: '롯데스타에비뉴', name_en: 'Lotte Star Avenue', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KP-PLACEHOLDER-WITHMUU', name_ko: '위드뮤 홍대', name_en: 'WITHMUU Hongdae', primary_image_url: null, display_region: 'Mapo-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // NEW — 멤버 발자취 (member footsteps), DEC-60. Cross-cuts categories by which
    // member visited, tagged with the team id (tile grid is team-level only — see
    // ExploreArtist comment). Leeum reuses tours' KP-014 poi_id/coords (same real
    // place, don't fork the record) rather than duplicating it. The other 4 named
    // in SPEC-04's "RM 미술관 코스 5곳" example have no confirmed core.poi row (BLK-36).
    memberFootsteps: [
      { poi_id: 'KP-014', name_ko: '리움미술관', name_en: 'Leeum Samsung Museum', primary_image_url: '/images/explore/kpop/KP-014_leeum-samsung-museum.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.53833657002706, coords_lng: 126.9991174495516, artistIds: ['bts'] },
      { poi_id: 'KP-PLACEHOLDER-GANAART', name_ko: '가나아트센터', name_en: 'Gana Art Center', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, artistIds: ['bts'], verified: false },
      { poi_id: 'KP-PLACEHOLDER-PKM', name_ko: 'PKM갤러리', name_en: 'PKM Gallery', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, artistIds: ['bts'], verified: false },
      { poi_id: 'KP-PLACEHOLDER-BUKSEOULMOA', name_ko: '북서울미술관', name_en: 'Buk-Seoul Museum of Art', primary_image_url: null, display_region: 'Nowon-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, artistIds: ['bts'], verified: false },
      { poi_id: 'KP-PLACEHOLDER-HOAM', name_ko: '호암미술관', name_en: 'Hoam Museum', primary_image_url: null, display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, artistIds: ['bts'], verified: false },
    ],
  },
  'k-drama': {
    // Kept unchanged — already real/verified, not contradicted by the content plan
    // (its hub-page crop only showed 4 rows; treated as a partial view, not a
    // directive to drop this row, per the same judgment call DEC-61 documents).
    tours: [
      { poi_id: 'KD002-001b', name_ko: '주문진방파제', name_en: 'Jumunjin Breakwater', primary_image_url: '/images/explore/kdrama/KD002-001b_jumunjin-breakwater-hero.png', display_region: 'Gangneung, Gangwon', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.9036, coords_lng: 128.8286 },
      { poi_id: 'KD002-001', name_ko: '비내섬', name_en: 'Binaeseom Island / Binae Trail', primary_image_url: '/images/explore/kdrama/KD002-001_binaeseom-island.png', display_region: 'Chungju, Chungbuk', quality_score: 0, is_trending: false, coords_lat: 37.10763245243604, coords_lng: 127.8177258622132 },
      { poi_id: 'KD016-003', name_ko: '문경새재 오픈세트장', name_en: 'Mungyeong Saejae Open Set', primary_image_url: '/images/home/trending/KD016-003_mungyeong-saejae-open-set.webp', display_region: 'Mungyeong, Gyeongsangbuk-do', quality_score: 0, is_trending: false, coords_lat: 36.7713996802656, coords_lng: 128.074072026373 },
      { poi_id: 'KD013-009', name_ko: '남이섬', name_en: 'Namiseom Café Area', primary_image_url: '/images/explore/kdrama/KD013-009_namiseom-cafe-area.png', display_region: 'Chuncheon, Gangwon', quality_score: 0, is_trending: false, coords_lat: 37.79144074509299, coords_lng: 127.5252101432974 },
    ],
    // 촬영지 (DEC-61) — reframed with the content plan's named examples. No real
    // per-item broadcaster/region attribution exists (same BLK-35-class gap as
    // K-Pop's concerts/tours/merch), so these stay unfiltered by the new
    // broadcaster/region chips — all placeholder, no confirmed core.poi row.
    filming: [
      { poi_id: 'KD-PLACEHOLDER-SEOULBAM', name_ko: '서울밤', name_en: 'Seoul Bam', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KD-PLACEHOLDER-HANBYEOKTUNNEL', name_ko: '한벽터널', name_en: 'Hanbyeok Tunnel', primary_image_url: null, display_region: 'Jeonju, Jeonbuk', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KD-PLACEHOLDER-AHYEONSUPER', name_ko: '아현수퍼', name_en: 'Ahyeon Super', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // 역사적 세트장 (DEC-61) — reframed. Ondal Tourist Site is a real, well-known
    // public heritage site (Danyang); Cheonjeongjeon/Sungjeongjeon Hall are named
    // set-hall locations from the content plan without a confirmed core.poi row —
    // all three ship placeholder pending BLK-37.
    historical: [
      { poi_id: 'KD-PLACEHOLDER-CHEONJEONGJEON', name_ko: '천정전', name_en: 'Cheonjeongjeon Hall', primary_image_url: null, display_region: 'Korea', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KD-PLACEHOLDER-SUNGJEONGJEON', name_ko: '숭정전', name_en: 'Sungjeongjeon Hall', primary_image_url: null, display_region: 'Korea', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KD-PLACEHOLDER-ONDAL', name_ko: '온달관광지', name_en: 'Ondal Tourist Site', primary_image_url: null, display_region: 'Danyang, Chungbuk', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      // 지금 뜨는 곳 (auto-populated via is_trending, generic mechanism unchanged for
      // non-k-pop categories) — Hwahongmun Gate is a real, confirmed public landmark
      // (Suwon Hwaseong Fortress gate); Gimnyeong Beach is a real Jeju beach, no
      // confirmed core.poi row of its own yet.
      { poi_id: 'KD-HWAHONGMUN', name_ko: '화홍문', name_en: 'Hwahongmun Gate', primary_image_url: null, display_region: 'Suwon, Gyeonggi', quality_score: 0, is_trending: true, coords_lat: 37.2925, coords_lng: 127.0177 },
      { poi_id: 'KD-PLACEHOLDER-GIMNYEONGBEACH', name_ko: '김녕해변', name_en: 'Gimnyeong Beach', primary_image_url: null, display_region: 'Jeju', quality_score: 0, is_trending: true, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    ostCafes: [
      { poi_id: 'KD002-009', name_ko: '제물포구락부', name_en: 'New Jemulpo Club', primary_image_url: '/images/explore/kdrama/KD002-009_new-jemulpo-club.png', display_region: 'Incheon Jung-gu', quality_score: 0, is_trending: false, coords_lat: 37.47463623198604, coords_lng: 126.6225221142413 },
      { poi_id: 'KD010-009', name_ko: '학림다방', name_en: 'Hakrim Dabang', primary_image_url: '/images/home/new/KD010-009_hakrim-dabang.webp', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.58195021892664, coords_lng: 127.0016574451341 },
      { poi_id: 'KD017-010', name_ko: '청하공진시장', name_en: 'Cheongha Gongjin Market Café', primary_image_url: '/images/explore/kdrama/KD017-010_cheongha-gongjin-market-cafe.png', display_region: 'Pohang, Gyeongbuk', quality_score: 0, is_trending: false, coords_lat: 36.19705421304869, coords_lng: 129.3397715303084 },
    ],
  },
  // DEC-61 — restructured from skincare/makeup/spa/salon to the content plan's
  // real 4 rows. Every real (coordinate-confirmed) item from the old 4 rows is
  // redistributed here, none dropped — see each row's comment for where it landed.
  'k-beauty': {
    // 쇼핑·편집샵 — Olive Young (already real, was tagged skincare) is a genuine
    // select-shop; the 4 old 'makeup' brand-counter items fold in here too (no
    // "makeup" row exists in the content plan's real structure). 3 new placeholders
    // for the deck's own named examples (department-store/duty-free beauty halls).
    shopping: [
      { poi_id: 'KB-NEW-065', name_ko: '올리브영 명동타운', name_en: 'Olive Young Myeongdong Town', primary_image_url: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 37.56398256073924, coords_lng: 126.9851873129621 },
      { poi_id: 'KB-MU-MD-001', name_ko: 'Makeup House Myeongdong', name_en: 'Makeup House Myeongdong', primary_image_url: '/images/explore/kbeauty/KB-MU-MD-001_makeup-house-myeongdong.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, district: 'Myeongdong', coords_lat: 37.5627516321022, coords_lng: 126.983907441043 },
      { poi_id: 'KB-MU-GN-003', name_ko: 'Cocory Color Seoul', name_en: 'Cocory Color Seoul', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.56377089583383, coords_lng: 126.985749889034 },
      { poi_id: 'KB-MU-GN-012', name_ko: 'Jung Saem Mool Inspiration West', name_en: 'Jung Saem Mool Inspiration West', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.52529441862385, coords_lng: 127.0487773089321 },
      { poi_id: 'KB-FLAG-SU-001', name_ko: 'AMUSE Seongsu Flagship Store', name_en: 'AMUSE Seongsu Flagship Store', primary_image_url: null, display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, district: 'Seongsu', coords_lat: 37.5438137552044, coords_lng: 127.050522918312 },
      { poi_id: 'KB-PLACEHOLDER-MUSINSA', name_ko: '무신사 뷰티 성수', name_en: 'Musinsa Beauty Seongsu', primary_image_url: null, display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, district: 'Seongsu', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KB-PLACEHOLDER-LOTTEDUTYFREE', name_ko: '롯데면세점 명동본점', name_en: 'Lotte Duty Free Myeongdong', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KB-PLACEHOLDER-SHINSEGAE', name_ko: '신세계 강남 뷰티관', name_en: 'Shinsegae Gangnam Beauty Hall', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // 브랜드 플래그십 — NEW row. Amore Seongsu/Sulwhasoo Dosan/Aesop Seongsu were
    // already real (moved from the old 'skincare' row, they're single-brand
    // flagship stores by nature). NONFICTION Seongsu is the deck's own named hero
    // example — no confirmed core.poi row of its own (distinct from the existing
    // Nonfiction Hannam branch).
    brandFlagship: [
      { poi_id: 'KB-FLAG-SU-003', name_ko: 'Amore Seongsu', name_en: 'Amore Seongsu', primary_image_url: '/images/explore/kbeauty/KB-FLAG-SU-003_amore-seongsu.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, district: 'Seongsu', coords_lat: 37.54435844202786, coords_lng: 127.0591808958532 },
      { poi_id: 'KB-NEW-138', name_ko: '설화수 도산플래그십스토어', name_en: 'Sulwhasoo Dosan Flagship', primary_image_url: '/images/explore/kbeauty/KB-NEW-138_sulwhasoo-dosan-flagship.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.52353049099649, coords_lng: 127.0354907462648 },
      { poi_id: 'KB-NEW-152', name_ko: '이솝 성수', name_en: 'Aesop Seongsu', primary_image_url: '/images/explore/kbeauty/KB-NEW-152_aesop-seongsu.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, district: 'Seongsu', coords_lat: 37.5423129121868, coords_lng: 127.056022296655 },
      { poi_id: 'KB-NEW-144', name_ko: '논픽션 한남', name_en: 'Nonfiction Hannam', primary_image_url: '/images/explore/kbeauty/KB-NEW-144_nonfiction-hannam.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.53625706385359, coords_lng: 127.0003428273847 },
      { poi_id: 'KB-PLACEHOLDER-NONFICTIONSEONGSU', name_ko: '논픽션 성수', name_en: 'NONFICTION Seongsu', primary_image_url: null, display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, district: 'Seongsu', coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // 약국·더마 — renamed from 'spa'. Real content unchanged (clinics/derma
    // already fit this row conceptually), no better-named deck examples given.
    derma: [
      { poi_id: 'KB-DER-GN-005', name_ko: 'Abijou Clinic Gangnam', name_en: 'Abijou Clinic Gangnam', primary_image_url: '/images/home/trending/KB-DER-GN-005_abijou-clinic-gangnam.webp', display_region: 'Seocho-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, district: 'Gangnam', coords_lat: 37.49864716138882, coords_lng: 127.0262645904912 },
      { poi_id: 'KB-DER-MD-005', name_ko: 'Lienjang Clinic Myeongdong', name_en: 'Lienjang Clinic Myeongdong', primary_image_url: '/images/explore/kbeauty/KB-DER-MD-005_lienjang-clinic-myeongdong.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 37.563410116935, coords_lng: 126.982886367076 },
      { poi_id: 'KB-NEW-416', name_ko: '아이디병원', name_en: 'ID Hospital', primary_image_url: '/images/explore/kbeauty/KB-NEW-416_id-hospital.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.5177642310409, coords_lng: 127.024157143362 },
      { poi_id: 'KB-DER-MD-003', name_ko: 'Muse Clinic Myeongdong', name_en: 'Muse Clinic Myeongdong', primary_image_url: '/images/explore/kbeauty/KB-DER-MD-003_muse-clinic-myeongdong.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 37.5609593565496, coords_lng: 126.982547382568 },
    ],
    salon: [
      { poi_id: 'KB-NEW-209', name_ko: '박승철헤어스투디오 압구정점', name_en: 'Park Seung Chul Hair Studio Apgujeong', primary_image_url: '/images/explore/kbeauty/KB-NEW-209_park-seungchul-hair-studio-apgujeong.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Apgujeong', coords_lat: 37.5267841995603, coords_lng: 127.028092451888 },
      { poi_id: 'KB-HAIR-AC-003', name_ko: 'JENNY HOUSE Cheongdam Hill', name_en: 'JENNY HOUSE Cheongdam Hill', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Apgujeong', coords_lat: 37.5213380930685, coords_lng: 127.0442623043087 },
      { poi_id: 'KB-HAIR-GN-003', name_ko: 'CHAHONG Room Gangnam', name_en: 'CHAHONG Room Gangnam', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.49652472851307, coords_lng: 127.0286838528369 },
      { poi_id: 'KB-HAIR-MD-001', name_ko: 'JUNO Hair Myeongdong', name_en: 'JUNO Hair Myeongdong', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 37.5615686368221, coords_lng: 126.9840050325429 },
    ],
  },
  // DEC-61 — new 5th section. No pre-existing seed at all (K-Food didn't exist
  // before this pass) — every item here is new. None carry a `badges` tag: the
  // content plan's badge system (미슐랭/레드리본/B4K픽/우쏠랑) isn't confirmed
  // per-item for these hub-row examples, only for the michelin-noodles detail
  // collection specifically (see lib/kfood-michelin-noodles.ts, where "Michelin
  // pick" is definitionally what that collection is, not an invented relation).
  // "기타" (509곳) deliberately skipped — the deck itself flags it as not usable
  // as a row.
  'k-food': {
    noodles: [
      { poi_id: 'KF-PLACEHOLDER-WOOLAEOAK2', name_ko: '우래옥', name_en: 'Woo Lae Oak', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KF-PLACEHOLDER-PILDONGMYEONOK', name_ko: '필동면옥', name_en: 'Pildong Myeonok', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KF-PLACEHOLDER-KYODAIYA', name_ko: '교다이야', name_en: 'Kyodaiya', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    soups: [
      { poi_id: 'KF-PLACEHOLDER-MAPOOK', name_ko: '마포옥', name_en: 'Mapo Ok', primary_image_url: null, display_region: 'Mapo-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KF-PLACEHOLDER-ANMOK', name_ko: '안목', name_en: 'Anmok', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KF-PLACEHOLDER-HANWOLGWAN', name_ko: '한월관', name_en: 'Hanwolgwan', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
    hanjeongsik: [
      { poi_id: 'KF-PLACEHOLDER-BIBIJAE', name_ko: '비비재', name_en: 'Bibijae', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KF-PLACEHOLDER-SONGHEONJIP', name_ko: '송현집', name_en: 'Songheonjip', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
    ],
  },
  // DEC-61 — restructured from traditional/food/festivals/crafts to the content
  // plan's real 4 rows. Every real (coordinate-confirmed) item from the old 4
  // rows redistributed here, none dropped.
  'k-culture': {
    // 역사·유적 — palaces/shrines (was 'traditional', minus Jogyesa which moves
    // to 'temple') + the 2 real markets (was 'food') + both folk villages (was
    // 'festivals') — all fit "historical heritage site" broadly. Suwon Hwaseong
    // Fortress reuses the real record already seeded under K-Drama's 'historical'
    // row (same real place, don't fork) — the content plan names it as this
    // row's own example too.
    heritage: [
      { poi_id: 'KD016-006', name_ko: '북촌한옥마을', name_en: 'Bukchon Hanok Village', primary_image_url: '/images/explore/kculture/KD016-006_bukchon-hanok-village.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.58176815383344, coords_lng: 126.9848124506409 },
      { poi_id: 'KC-SEO-182', name_ko: '종묘', name_en: 'Jongmyo Shrine', primary_image_url: '/images/explore/kculture/KC-SEO-182_jongmyo-shrine.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5761080433804, coords_lng: 126.994212979827 },
      { poi_id: 'KD016-001', name_ko: '창덕궁', name_en: 'Changdeokgung Palace', primary_image_url: '/images/home/trending/KD016-001_changdeokgung-palace.webp', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, region: 'Seoul', coords_lat: 37.57964694739535, coords_lng: 126.9909998067713 },
      { poi_id: 'KD028-014', name_ko: '운현궁', name_en: 'Unhyeongung Palace', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.576226410093, coords_lng: 126.987085596535 },
      { poi_id: 'KD005-014', name_ko: '수원화성', name_en: 'Suwon Hwaseong Fortress', primary_image_url: null, display_region: 'Suwon, Gyeonggi', quality_score: 0, is_trending: false, region: 'Gyeonggi', coords_lat: 37.2869569586225, coords_lng: 127.011795743342 },
      { poi_id: 'KC-SEO-148', name_ko: '남대문시장', name_en: 'Namdaemun Market', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.55918176072071, coords_lng: 126.9776267740439 },
      { poi_id: 'KC-SEO-149', name_ko: '통인시장', name_en: 'Tongin Market', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.58076970747926, coords_lng: 126.9699479604657 },
      { poi_id: 'KD029-014', name_ko: '한국민속촌', name_en: 'Korean Folk Village', primary_image_url: '/images/explore/kculture/KD029-014_korean-folk-village.png', display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.25961522542851, coords_lng: 127.1198007202516 },
      { poi_id: 'KC-GSB-101', name_ko: '안동민속촌', name_en: 'Andong Folk Village', primary_image_url: null, display_region: 'Andong, Gyeongbuk', quality_score: 0, is_trending: false, region: 'Andong', coords_lat: 36.57675373532396, coords_lng: 128.765295003501 },
    ],
    // 자연·경관 — NEW row. Seongsan Ilchulbong reuses the real record already
    // seeded under K-Drama's hero/historical (same real place).
    nature: [
      { poi_id: 'KD-SEONGSAN-ILCHULBONG', name_ko: '성산일출봉', name_en: 'Seongsan Ilchulbong', primary_image_url: null, display_region: 'Seogwipo, Jeju', quality_score: 0, is_trending: false, region: 'Jeju', coords_lat: 33.4587, coords_lng: 126.9425 },
      { poi_id: 'KC-PLACEHOLDER-MANJANGGUL', name_ko: '만장굴', name_en: 'Manjanggul Cave', primary_image_url: null, display_region: 'Jeju', quality_score: 0, is_trending: false, region: 'Jeju', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KC-PLACEHOLDER-HALLASAN', name_ko: '한라산국립공원', name_en: 'Hallasan National Park', primary_image_url: null, display_region: 'Jeju', quality_score: 0, is_trending: false, region: 'Jeju', coords_lat: 0, coords_lng: 0, verified: false },
    ],
    // 사찰·종교 — Jogyesa Temple moves here from 'traditional' (real, unchanged).
    temple: [
      { poi_id: 'KC-SEO-184', name_ko: '조계사', name_en: 'Jogyesa Temple', primary_image_url: '/images/explore/kculture/KC-SEO-184_jogyesa-temple.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.57395881968132, coords_lng: 126.98185608504 },
    ],
    // 박물관·미술관 — NEW row. National Museum of Korea and MMCA Seoul are
    // well-known, unambiguous public landmarks (same "real, unconfirmed core.poi
    // row, high real-world confidence" judgment as K-Drama's Hwahongmun Gate);
    // Seoul Craft Museum's exact coordinates aren't something this session has
    // confident knowledge of, so it stays placeholder. Old 'crafts' row's 3
    // "experience point" items fold in here too — closest conceptual fit,
    // nothing else in the new 4-row structure suits them either.
    museum: [
      { poi_id: 'KC-NATIONALMUSEUM', name_ko: '국립중앙박물관', name_en: 'National Museum of Korea', primary_image_url: null, display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5240, coords_lng: 126.9803 },
      { poi_id: 'KC-PLACEHOLDER-CRAFTMUSEUM', name_ko: '서울공예박물관', name_en: 'Seoul Craft Museum', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 0, coords_lng: 0, verified: false },
      { poi_id: 'KC-MMCASEOUL', name_ko: '국립현대미술관 서울관', name_en: 'MMCA Seoul', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5788, coords_lng: 126.9770 },
      { poi_id: 'KC-SEO-270', name_ko: '경복궁 - 체험 예약 포인트', name_en: 'Palace-Gate Experiences', primary_image_url: '/images/explore/kculture/KC-SEO-270_palace-gate-experiences.png', display_region: 'Gwangjin-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.53604245097937, coords_lng: 127.0958748426305 },
      { poi_id: 'KC-SEO-281', name_ko: '청계천 - 체험 예약 포인트', name_en: 'Cheonggyecheon Experience Point', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5691469686793, coords_lng: 126.978647068151 },
      { poi_id: 'KC-GGI-241', name_ko: '에버랜드 - 전통공예 체험', name_en: 'Everland Traditional Craft Experience', primary_image_url: null, display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.2756257163761, coords_lng: 127.030623743794 },
    ],
  },
}

// CT_KP_EXT (DEC-60) — 지금 뜨는 곳 (Trending Now) is reframed as the seasonal
// auto-rotation row for k-pop specifically (see GET): whichever artist has a
// birthday_month matching the current month supplies this row's content via
// SEED_TRENDING_BY_ARTIST; if none does (true for every artist today — see
// SEED_ARTISTS comment), SEED_TRENDING_UNATTRIBUTED is the fallback. These 5 café
// names are the content plan's real "이번 달 생일카페" example, but the doc doesn't
// name which member/month they belong to (no real BTS member has an August
// birthday), so they ship unattributed (no artistIds) and verified:false — every
// real user sees an empty Trending Now row until a real member+month pairing lands.
const SEED_TRENDING_BY_ARTIST: Record<string, ExplorePoi[]> = {}

const SEED_TRENDING_UNATTRIBUTED: ExplorePoi[] = [
  { poi_id: 'KP-PLACEHOLDER-PIEDPIPER', name_ko: '피리부는사나이', name_en: 'PIED PIPER', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
  { poi_id: 'KP-PLACEHOLDER-BLACKDRUM', name_ko: '블랙드럼', name_en: 'Black Drum', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
  { poi_id: 'KP-PLACEHOLDER-KIDMOON', name_ko: '킷문카페', name_en: 'Kidmoon Cafe', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
  { poi_id: 'KP-PLACEHOLDER-MARINECOFFEE', name_ko: '마린커피', name_en: 'Marine Coffee', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
  { poi_id: 'KP-PLACEHOLDER-DELULU', name_ko: '델룰루', name_en: 'Delulu', primary_image_url: null, display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 0, coords_lng: 0, verified: false },
]

// next-intl locales (i18n/routing.ts) — translations JSONB keys must match this
// exact casing (e.g. 'zh-CN' not 'zh_CN') or the lookup below silently misses.
function mapPlace(p: BffPlace, locale: string): ExplorePoi {
  return {
    poi_id: String(p.poi_id),
    name_ko: p.name_ko,
    // Display-name rule: translations[locale].name, falling back to English
    // then Korean — matches hooks/useMapPois.ts's mapPlace().
    name_en: p.translations?.[locale]?.name ?? (locale === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
    primary_image_url: p.primary_image_url,
    display_region: p.display_region ?? '',
    quality_score: 0, // not exposed by BFF list_places
    is_trending: false, // no backing flag — the trending row is like-ordered instead
    coords_lat: p.coords_lat,
    coords_lng: p.coords_lng,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  const sectionIds = SECTIONS_BY_CATEGORY[params.category]
  if (!sectionIds) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'en'

  // CT_KP_EXT (DEC-60) — dev-only preview of placeholder (verified:false) content so
  // DoD gates 2/3/6 can be tested against complete-looking rows before BLK-35/BLK-36
  // resolve. Gated on both the query param AND non-production so it's a no-op if a
  // stray query param ever reaches a real deploy.
  const includeUnverified =
    process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('includeUnverified') === '1'
  const dropUnverified = (poi: { verified?: boolean }) => includeUnverified || poi.verified !== false

  // BFF domain values match the category slugs 1:1. A BFF failure here must
  // NOT kill the whole response — the interim content seed below (hero +
  // thematic sections) still needs to render even when the real backend is
  // unreachable/not-yet-wired. Only the live Trending Now row degrades to
  // empty on failure; everything else falls back to the seed as normal.
  let items: ExplorePoi[] = []
  try {
    const places = await bffFetch<BffPlace[]>(
      `/places?domain=${encodeURIComponent(params.category)}&limit=40`
    )
    items = (places ?? []).map(p => mapPlace(p, locale))
  } catch {
    items = []
  }

  // Thematic sections use the interim content seed above — the BFF has no
  // per-section facet (concerts/tours/skincare/…) on places yet. Real POIs
  // also surface in the like-ordered Trending Now row below, independent of
  // this seed. Packages stay [] on every category (see SEED_HERO comment).
  const base: ExploreData = {
    category: params.category,
    hero: (SEED_HERO[params.category] ?? []).filter(dropUnverified),
    sections: sectionIds.map(id => ({
      id,
      items: (SEED_SECTIONS[params.category]?.[id] ?? []).filter(dropUnverified),
    })),
    packages: [],
  }

  const facets = FACETS_BY_CATEGORY[params.category] ?? []

  // Trending Now (KP/KB/KC_02) is built from the UNFILTERED data — the trending
  // row sits above the chip-scoped sections and must not collapse under a
  // filter. Items flagged is_trending in sections take priority; otherwise the
  // BFF like-count ordering (list_places sorts like_count DESC) stands in.
  const seen = new Set<string>()
  const flagged: ExplorePoi[] = []
  for (const s of base.sections) {
    for (const it of s.items) {
      if (it.is_trending && !seen.has(it.poi_id)) {
        seen.add(it.poi_id)
        flagged.push(it)
      }
    }
  }
  let trendingSection: ExploreSection = {
    id: 'trending',
    items: (flagged.length > 0 ? flagged : items).slice(0, 8),
  }

  // CT_KP_EXT (DEC-60) — k-pop only: Trending Now is reframed as the seasonal
  // birthday-member auto-rotation row instead of the generic like-ordered/flagged
  // one above. Whichever artist's birthday_month matches the current calendar month
  // supplies the content; none does today (see SEED_ARTISTS), so every real k-pop
  // user sees the unattributed placeholder set only via ?includeUnverified=1.
  if (params.category === 'k-pop') {
    const currentMonth = new Date().getMonth() + 1
    const birthdayArtist = (SEED_ARTISTS['k-pop'] ?? []).find(a => a.birthday_month === currentMonth)
    const trendingItems = birthdayArtist
      ? (SEED_TRENDING_BY_ARTIST[birthdayArtist.id] ?? SEED_TRENDING_UNATTRIBUTED)
      : SEED_TRENDING_UNATTRIBUTED
    trendingSection = { id: 'trending', items: trendingItems.filter(dropUnverified) }
  }

  // Apply each active chip filter only to sections whose items carry that facet (the
  // chip is spec-scoped to those sections). Untagged sections pass through unchanged.
  // Multiple facets (e.g. K-Drama's broadcaster + region) apply as AND — a section
  // narrows once per active facet. Note: BFF places don't carry these facets yet, so
  // this is a pass-through until that data exists.
  let sections = base.sections
  for (const fc of facets) {
    const value = req.nextUrl.searchParams.get(fc.param)
    if (!value) continue
    sections = sections.map((s) => {
      const anyTagged = s.items.some((it) => it[fc.field] !== undefined)
      if (!anyTagged) return s
      return {
        ...s,
        items: s.items.filter((it) => {
          if (fc.array) {
            const arr = (it[fc.field] as string[] | undefined) ?? []
            return value === 'MULTI' ? arr.length >= 2 : arr.includes(value)
          }
          return it[fc.field] === value
        }),
      }
    })
  }

  const data: ExploreData = {
    category: base.category,
    hero: base.hero,
    packages: base.packages,
    artists: SEED_ARTISTS[params.category] ?? [],
    sections: [trendingSection, ...sections],
  }
  return NextResponse.json(data)
}
