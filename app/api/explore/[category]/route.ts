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
  /** ISO date (YYYY-MM-DD) for D-Day countdown on event/merch/festival items. */
  event_date?: string
  /** SC-36 (KD_04/KB_04) — one featured item renders as a wide card above the row. */
  is_featured?: boolean
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
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
  'k-pop': ['concerts', 'tours', 'agencies', 'merchandise'],
  'k-drama': ['filming', 'tours', 'historical', 'ostCafes'],
  'k-beauty': ['skincare', 'makeup', 'spa', 'salon'],
  'k-culture': ['traditional', 'food', 'festivals', 'crafts'],
}

/** Facet key per category — the single query param that hub's chips drive. */
const FACET_BY_CATEGORY: Record<string, keyof ExplorePoi | undefined> = {
  'k-pop': 'agency',
  'k-beauty': 'district',
  'k-culture': 'region',
  'k-drama': undefined,
}

// Interim content seed for the thematic sections + hero (the BFF has no
// per-section facet yet — see comment on `base` below). Every row cross-checked
// against B4K_POI_DB_IMPORT_CLEANED_1500.xlsx (poi_id/coords are the real DB
// values). quality_score 0 / is_trending false: no real engagement signal to
// report yet, not fabricated. primary_image_url null pending Cloudinary wiring.
// `packages` stays [] on every category — no confirmed real partner_url to ship
// (see DEC-50). Replace with the real per-section BFF facet once it exists.
const SEED_HERO: Record<string, ExploreHeroSlide[]> = {
  'k-pop': [{ id: 'KP-207', badge: 'ICONIC VENUE', title: 'Olympic Park KSPO Dome', subtitle: '송파구 올림픽로 424 — BTS, Seventeen, and more have all taken this stage. Even between shows, it’s a pilgrimage stop for fans.', cta_label: 'SEE THE VENUE', cta_href: '/map?poi=KP-207', image_url: '/images/explore/kpop/HERO_zeprincess11-stadium-concert-purple-lights.png' }],
  'k-drama': [{ id: 'KD002-001b', badge: 'GOBLIN PILGRIMAGE', title: 'Jumunjin Breakwater', subtitle: '강원 강릉시 주문진읍 교항리 — where Kim Shin and Eun-tak first met. The red-scarf photo tradition still lives on.', cta_label: 'SEE THE ROUTE', cta_href: '/map?poi=KD002-001b', image_url: '/images/explore/kdrama/KD002-001b_jumunjin-breakwater-hero.png' }],
  'k-beauty': [{ id: 'KB-NEW-065', badge: 'SHOPPING HUB', title: 'Olive Young Myeongdong', subtitle: '중구 명동8길 14 — Korea’s biggest K-beauty retailer, right in the middle of Seoul’s busiest shopping street.', cta_label: 'START SHOPPING', cta_href: '/map?poi=KB-NEW-065', image_url: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp' }],
  'k-culture': [{ id: 'KD016-014', badge: 'ROYAL SEOUL', title: 'Gyeongbokgung Palace', subtitle: '종로구 사직로 161 — Korea’s grandest royal palace, with an hourly changing-of-the-guard ceremony.', cta_label: 'EXPLORE PALACES', cta_href: '/map?poi=KD016-014', image_url: '/images/home/hero/KD016-014_gyeongbokgung-hero-wide.webp' }],
}

const SEED_SECTIONS: Record<string, Record<string, ExplorePoi[]>> = {
  'k-pop': {
    concerts: [
      { poi_id: 'KP-005', name_ko: '인스파이어 아레나', name_en: 'Inspire Arena', primary_image_url: '/images/explore/kpop/KP-005_inspire-arena.png', display_region: 'Incheon', quality_score: 0, is_trending: false, coords_lat: 37.46668401261223, coords_lng: 126.3905883002809 },
      { poi_id: 'KP-0823', name_ko: '장충체육관', name_en: 'Jangchung Arena', primary_image_url: '/images/explore/kpop/KP-0823_jangchung-arena.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.558178171371, coords_lng: 127.006808757736 },
      { poi_id: 'KP-0824', name_ko: '블루스퀘어', name_en: 'Blue Square', primary_image_url: '/images/explore/kpop/KP-0824_blue-square.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5408611480276, coords_lng: 127.002548167462 },
      { poi_id: 'KP-0864', name_ko: '고척스카이돔', name_en: 'Gocheok Sky Dome', primary_image_url: '/images/explore/kpop/KP-0864_gocheok-sky-dome.png', display_region: 'Guro-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.49821220764421, coords_lng: 126.8670889679075 },
    ],
    tours: [
      { poi_id: 'KP-014', name_ko: '리움미술관', name_en: 'Leeum Samsung Museum', primary_image_url: '/images/explore/kpop/KP-014_leeum-samsung-museum.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.53833657002706, coords_lng: 126.9991174495516 },
      { poi_id: 'KD024-004', name_ko: 'DDP 동대문디자인플라자', name_en: 'Dongdaemun Design Plaza', primary_image_url: '/images/home/editorial/KD001-019_ddp.webp', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5671843130818, coords_lng: 127.009911013917 },
      { poi_id: 'KP-067', name_ko: '경리단길', name_en: 'Gyeongridan-gil', primary_image_url: '/images/explore/kpop/KP-067_gyeongridan-gil.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5397580614249, coords_lng: 126.991721972247 },
      { poi_id: 'KP-111', name_ko: '일산호수공원', name_en: 'Ilsan Lake Park', primary_image_url: '/images/explore/kpop/KP-111_ilsan-lake-park.png', display_region: 'Goyang, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.6561360415672, coords_lng: 126.764141543966 },
    ],
    agencies: [
      { poi_id: 'KP-075', name_ko: 'JYP 센터', name_en: 'JYP Center', primary_image_url: '/images/explore/kpop/KP-075_jyp-center.png', display_region: 'Gangdong-gu, Seoul', quality_score: 0, is_trending: false, agency: 'JYP', coords_lat: 37.524129269795, coords_lng: 127.129131076272 },
      { poi_id: 'KP-192', name_ko: 'SM엔터테인먼트 사옥', name_en: 'SM Entertainment HQ', primary_image_url: '/images/explore/kpop/KP-192_sm-hq.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, agency: 'SM', coords_lat: 37.54414907499344, coords_lng: 127.0433501688011 },
      { poi_id: 'KP-199', name_ko: 'YG엔터테인먼트 사옥', name_en: 'YG Entertainment HQ', primary_image_url: '/images/explore/kpop/KP-199_yg-hq.png', display_region: 'Mapo-gu, Seoul', quality_score: 0, is_trending: false, agency: 'YG', coords_lat: 37.5502023926174, coords_lng: 126.918287778213 },
      { poi_id: 'KP-159', name_ko: '큐브엔터테인먼트', name_en: 'CUBE Entertainment', primary_image_url: '/images/explore/kpop/KP-159_cube-entertainment.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5456099572053, coords_lng: 127.053456066552 },
    ],
    merchandise: [
      { poi_id: 'KP-0250', name_ko: '더현대 서울', name_en: 'The Hyundai Seoul', primary_image_url: '/images/explore/kpop/KP-0250_the-hyundai-seoul.png', display_region: 'Yeongdeungpo-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.52587207102913, coords_lng: 126.9284461241116 },
      { poi_id: 'KP-1090', name_ko: '커먼그라운드', name_en: 'Common Ground', primary_image_url: '/images/home/new/KP-1090_common-ground.webp', display_region: 'Gwangjin-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.54105555235208, coords_lng: 127.0656686600397 },
      { poi_id: 'KP-0408', name_ko: '케이타운포유 코엑스', name_en: 'Ktown4u COEX', primary_image_url: '/images/explore/kpop/KP-0408_ktown4u-coex.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.50996877837638, coords_lng: 127.0613875508475 },
      { poi_id: 'KP-0409', name_ko: '케이타운포유 인사', name_en: 'Ktown4u Insa', primary_image_url: '/images/explore/kpop/KP-0409_ktown4u-insa.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.57446722916056, coords_lng: 126.9835517296716 },
    ],
  },
  'k-drama': {
    tours: [
      { poi_id: 'KD002-001b', name_ko: '주문진방파제', name_en: 'Jumunjin Breakwater', primary_image_url: '/images/explore/kdrama/KD002-001b_jumunjin-breakwater-hero.png', display_region: 'Gangneung, Gangwon', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.9036, coords_lng: 128.8286 },
      { poi_id: 'KD002-001', name_ko: '비내섬', name_en: 'Binaeseom Island / Binae Trail', primary_image_url: '/images/explore/kdrama/KD002-001_binaeseom-island.png', display_region: 'Chungju, Chungbuk', quality_score: 0, is_trending: false, coords_lat: 37.10763245243604, coords_lng: 127.8177258622132 },
      { poi_id: 'KD016-003', name_ko: '문경새재 오픈세트장', name_en: 'Mungyeong Saejae Open Set', primary_image_url: '/images/home/trending/KD016-003_mungyeong-saejae-open-set.webp', display_region: 'Mungyeong, Gyeongsangbuk-do', quality_score: 0, is_trending: false, coords_lat: 36.7713996802656, coords_lng: 128.074072026373 },
      { poi_id: 'KD013-009', name_ko: '남이섬', name_en: 'Namiseom Café Area', primary_image_url: '/images/explore/kdrama/KD013-009_namiseom-cafe-area.png', display_region: 'Chuncheon, Gangwon', quality_score: 0, is_trending: false, coords_lat: 37.79144074509299, coords_lng: 127.5252101432974 },
    ],
    filming: [
      { poi_id: 'KD003-003', name_ko: '오리올', name_en: 'Oriole Rooftop Bar', primary_image_url: '/images/explore/kdrama/KD003-003_oriole-rooftop-bar.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5316076300166, coords_lng: 126.9920215556666 },
      { poi_id: 'KD003-014', name_ko: '남산공원', name_en: 'Namsan Park', primary_image_url: '/images/explore/kdrama/KD003-014_namsan-park.png', display_region: 'Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5524979951415, coords_lng: 126.989316855952 },
      { poi_id: 'KD016-012', name_ko: '용인대장금테마파크', name_en: 'Yongin Dae Jang Geum Park Set', primary_image_url: '/images/home/recommended/KD016-012_yongin-daejanggeum-park.webp', display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.1211916935391, coords_lng: 127.337579430944 },
      { poi_id: 'KP-0633', name_ko: 'SBS프리즘타워', name_en: 'SBS Prism Tower', primary_image_url: '/images/explore/kdrama/KP-0633_sbs-prism-tower.png', display_region: 'Mapo-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5797103213346, coords_lng: 126.892781019504 },
      { poi_id: 'KD017-015', name_ko: '청진2리항', name_en: 'Cheongjin 2-ri Breakwater', primary_image_url: '/images/explore/kdrama/KD017-015_cheongjin-2ri-breakwater.png', display_region: 'Pohang, Gyeongbuk', quality_score: 0, is_trending: false, coords_lat: 36.1743210094615, coords_lng: 129.395809146558 },
    ],
    historical: [
      { poi_id: 'KD020-011', name_ko: '전주한옥마을', name_en: 'Jeonju Hanok Stay', primary_image_url: '/images/explore/kdrama/KD020-011_jeonju-hanok-stay.png', display_region: 'Jeonju, Jeonbuk', quality_score: 0, is_trending: false, coords_lat: 35.81477744329797, coords_lng: 127.1525570014218 },
      { poi_id: 'KD028-014', name_ko: '운현궁', name_en: 'Unhyeongung Palace', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.576226410093, coords_lng: 126.987085596535 },
      { poi_id: 'KD005-014', name_ko: '수원화성', name_en: 'Suwon Hwaseong Fortress', primary_image_url: null, display_region: 'Suwon, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.2869569586225, coords_lng: 127.011795743342 },
    ],
    ostCafes: [
      { poi_id: 'KD002-009', name_ko: '제물포구락부', name_en: 'New Jemulpo Club', primary_image_url: '/images/explore/kdrama/KD002-009_new-jemulpo-club.png', display_region: 'Incheon Jung-gu', quality_score: 0, is_trending: false, coords_lat: 37.47463623198604, coords_lng: 126.6225221142413 },
      { poi_id: 'KD010-009', name_ko: '학림다방', name_en: 'Hakrim Dabang', primary_image_url: '/images/home/new/KD010-009_hakrim-dabang.webp', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, coords_lat: 37.58195021892664, coords_lng: 127.0016574451341 },
      { poi_id: 'KD017-010', name_ko: '청하공진시장', name_en: 'Cheongha Gongjin Market Café', primary_image_url: '/images/explore/kdrama/KD017-010_cheongha-gongjin-market-cafe.png', display_region: 'Pohang, Gyeongbuk', quality_score: 0, is_trending: false, coords_lat: 36.19705421304869, coords_lng: 129.3397715303084 },
    ],
  },
  'k-beauty': {
    skincare: [
      { poi_id: 'KB-FLAG-SU-003', name_ko: 'Amore Seongsu', name_en: 'Amore Seongsu', primary_image_url: '/images/explore/kbeauty/KB-FLAG-SU-003_amore-seongsu.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.54435844202786, coords_lng: 127.0591808958532 },
      { poi_id: 'KB-NEW-138', name_ko: '설화수 도산플래그십스토어', name_en: 'Sulwhasoo Dosan Flagship', primary_image_url: '/images/explore/kbeauty/KB-NEW-138_sulwhasoo-dosan-flagship.png', display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.52353049099649, coords_lng: 127.0354907462648 },
      { poi_id: 'KB-NEW-144', name_ko: '논픽션 한남', name_en: 'Nonfiction Hannam', primary_image_url: '/images/explore/kbeauty/KB-NEW-144_nonfiction-hannam.png', display_region: 'Yongsan-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.53625706385359, coords_lng: 127.0003428273847 },
      { poi_id: 'KB-NEW-152', name_ko: '이솝 성수', name_en: 'Aesop Seongsu', primary_image_url: '/images/explore/kbeauty/KB-NEW-152_aesop-seongsu.png', display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5423129121868, coords_lng: 127.056022296655 },
      { poi_id: 'KB-NEW-065', name_ko: '올리브영 명동타운', name_en: 'Olive Young Myeongdong Town', primary_image_url: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, district: 'Myeongdong', coords_lat: 37.56398256073924, coords_lng: 126.9851873129621 },
    ],
    makeup: [
      { poi_id: 'KB-MU-MD-001', name_ko: 'Makeup House Myeongdong', name_en: 'Makeup House Myeongdong', primary_image_url: '/images/explore/kbeauty/KB-MU-MD-001_makeup-house-myeongdong.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, district: 'Myeongdong', coords_lat: 37.5627516321022, coords_lng: 126.983907441043 },
      { poi_id: 'KB-MU-GN-003', name_ko: 'Cocory Color Seoul', name_en: 'Cocory Color Seoul', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.56377089583383, coords_lng: 126.985749889034 },
      { poi_id: 'KB-MU-GN-012', name_ko: 'Jung Saem Mool Inspiration West', name_en: 'Jung Saem Mool Inspiration West', primary_image_url: null, display_region: 'Gangnam-gu, Seoul', quality_score: 0, is_trending: false, district: 'Gangnam', coords_lat: 37.52529441862385, coords_lng: 127.0487773089321 },
      { poi_id: 'KB-FLAG-SU-001', name_ko: 'AMUSE Seongsu Flagship Store', name_en: 'AMUSE Seongsu Flagship Store', primary_image_url: null, display_region: 'Seongdong-gu, Seoul', quality_score: 0, is_trending: false, coords_lat: 37.5438137552044, coords_lng: 127.050522918312 },
    ],
    spa: [
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
  'k-culture': {
    traditional: [
      { poi_id: 'KD016-006', name_ko: '북촌한옥마을', name_en: 'Bukchon Hanok Village', primary_image_url: '/images/explore/kculture/KD016-006_bukchon-hanok-village.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.58176815383344, coords_lng: 126.9848124506409 },
      { poi_id: 'KC-SEO-184', name_ko: '조계사', name_en: 'Jogyesa Temple', primary_image_url: '/images/explore/kculture/KC-SEO-184_jogyesa-temple.png', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.57395881968132, coords_lng: 126.98185608504 },
      { poi_id: 'KC-SEO-182', name_ko: '종묘', name_en: 'Jongmyo Shrine', primary_image_url: '/images/explore/kculture/KC-SEO-182_jongmyo-shrine.png', display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5761080433804, coords_lng: 126.994212979827 },
      { poi_id: 'KD016-001', name_ko: '창덕궁', name_en: 'Changdeokgung Palace', primary_image_url: '/images/home/trending/KD016-001_changdeokgung-palace.webp', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.57964694739535, coords_lng: 126.9909998067713 },
      { poi_id: 'KD028-014', name_ko: '운현궁', name_en: 'Unhyeongung Palace', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.576226410093, coords_lng: 126.987085596535 },
    ],
    food: [
      { poi_id: 'KD016-007', name_ko: '광장시장', name_en: 'Gwangjang Market', primary_image_url: '/images/home/trending/KD016-007_gwangjang-market.webp', display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, is_featured: true, region: 'Seoul', coords_lat: 37.57005529646949, coords_lng: 126.9989472822363 },
      { poi_id: 'KC-SEO-148', name_ko: '남대문시장', name_en: 'Namdaemun Market', primary_image_url: null, display_region: 'Jung-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.55918176072071, coords_lng: 126.9776267740439 },
      { poi_id: 'KC-SEO-149', name_ko: '통인시장', name_en: 'Tongin Market', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.58076970747926, coords_lng: 126.9699479604657 },
    ],
    festivals: [
      { poi_id: 'KD029-014', name_ko: '한국민속촌', name_en: 'Korean Folk Village', primary_image_url: '/images/explore/kculture/KD029-014_korean-folk-village.png', display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.25961522542851, coords_lng: 127.1198007202516 },
      { poi_id: 'KC-GSB-101', name_ko: '안동민속촌', name_en: 'Andong Folk Village', primary_image_url: null, display_region: 'Andong, Gyeongbuk', quality_score: 0, is_trending: false, region: 'Andong', coords_lat: 36.57675373532396, coords_lng: 128.765295003501 },
    ],
    crafts: [
      { poi_id: 'KC-SEO-270', name_ko: '경복궁 - 체험 예약 포인트', name_en: 'Palace-Gate Experiences', primary_image_url: '/images/explore/kculture/KC-SEO-270_palace-gate-experiences.png', display_region: 'Gwangjin-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.53604245097937, coords_lng: 127.0958748426305 },
      { poi_id: 'KC-SEO-281', name_ko: '청계천 - 체험 예약 포인트', name_en: 'Cheonggyecheon Experience Point', primary_image_url: null, display_region: 'Jongno-gu, Seoul', quality_score: 0, is_trending: false, region: 'Seoul', coords_lat: 37.5691469686793, coords_lng: 126.978647068151 },
      { poi_id: 'KC-GGI-241', name_ko: '에버랜드 - 전통공예 체험', name_en: 'Everland Traditional Craft Experience', primary_image_url: null, display_region: 'Yongin, Gyeonggi', quality_score: 0, is_trending: false, coords_lat: 37.2756257163761, coords_lng: 127.030623743794 },
    ],
  },
}

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
    hero: SEED_HERO[params.category] ?? [],
    sections: sectionIds.map(id => ({ id, items: SEED_SECTIONS[params.category]?.[id] ?? [] })),
    packages: [],
  }

  const facet = FACET_BY_CATEGORY[params.category]
  const filterValue = facet ? req.nextUrl.searchParams.get(facet) : null

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
  const trendingSection: ExploreSection = {
    id: 'trending',
    items: (flagged.length > 0 ? flagged : items).slice(0, 8),
  }

  // Apply chip filter only to sections whose items carry the facet (the chip is
  // spec-scoped to those sections). Untagged sections pass through unchanged.
  // Note: BFF places don't carry agency/district/region facets yet, so this is
  // a pass-through until that data exists (BFF region= expects Korean
  // display_region values — the English chip values wouldn't match).
  let sections = base.sections
  if (facet && filterValue) {
    sections = base.sections.map((s) => {
      const anyTagged = s.items.some((it) => it[facet] !== undefined)
      if (!anyTagged) return s
      return { ...s, items: s.items.filter((it) => it[facet] === filterValue) }
    })
  }

  const data: ExploreData = {
    category: base.category,
    hero: base.hero,
    packages: base.packages,
    sections: [trendingSection, ...sections],
  }
  return NextResponse.json(data)
}
