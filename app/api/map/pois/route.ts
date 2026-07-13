import { NextRequest, NextResponse } from 'next/server'

export interface MapPoi {
  place_id: string
  name_ko: string
  name_en: string
  coords_lat: number
  coords_lng: number
  display_domain: string
  display_region: string
  display_region_detail?: string
  is_trending: boolean
  is_partner: boolean
  quality_score: number
  // Detail fields (DEC-31: no ratings/reviews — save count only)
  save_count?: number
  is_open?: boolean
  hours_open?: string
  hours_close?: string
  // Full-snap detail (POIBottomSheet full state, S-DEVEQK)
  description?: string
  address?: string
  website_url?: string
}

// Stub: replace with Supabase query against service.places_snapshot when API is ready
const MOCK_POIS: MapPoi[] = [
  { place_id: 'p1',  name_ko: '경복궁',         name_en: 'Gyeongbokgung Palace',     coords_lat: 37.5796, coords_lng: 126.9770, display_domain: 'Palaces',     display_region: 'Seoul',    display_region_detail: 'Jongno-gu',  is_trending: true,  is_partner: false, quality_score: 95, save_count: 2341, is_open: true,  hours_open: '09:00', hours_close: '18:00' },
  { place_id: 'p2',  name_ko: '창덕궁',          name_en: 'Changdeokgung',            coords_lat: 37.5793, coords_lng: 126.9910, display_domain: 'Palaces',     display_region: 'Seoul',    display_region_detail: 'Jongno-gu',  is_trending: false, is_partner: false, quality_score: 88, save_count: 1204, is_open: true,  hours_open: '09:00', hours_close: '17:30' },
  { place_id: 'p3',  name_ko: '조계사',          name_en: 'Jogyesa Temple',           coords_lat: 37.5742, coords_lng: 126.9814, display_domain: 'Temples',     display_region: 'Seoul',    display_region_detail: 'Jongno-gu',  is_trending: false, is_partner: false, quality_score: 82, save_count: 872,  is_open: true,  hours_open: '06:00', hours_close: '22:00' },
  { place_id: 'p4',  name_ko: '익선동 카페',     name_en: 'Ikseon-dong Café',         coords_lat: 37.5748, coords_lng: 126.9891, display_domain: 'Cafes',       display_region: 'Seoul',    display_region_detail: 'Jongno-gu',  is_trending: true,  is_partner: true,  quality_score: 79, save_count: 543,  is_open: true,  hours_open: '11:00', hours_close: '21:00' },
  { place_id: 'p5',  name_ko: '북촌 한옥마을',   name_en: 'Bukchon Hanok Village',    coords_lat: 37.5826, coords_lng: 126.9852, display_domain: 'Parks',       display_region: 'Seoul',    display_region_detail: 'Jongno-gu',  is_trending: true,  is_partner: false, quality_score: 91, save_count: 1876, is_open: true,  hours_open: '00:00', hours_close: '23:59' },
  { place_id: 'p6',  name_ko: '명동 먹자골목',   name_en: 'Myeongdong Food Street',   coords_lat: 37.5636, coords_lng: 126.9831, display_domain: 'Restaurants', display_region: 'Seoul',    display_region_detail: 'Jung-gu',    is_trending: true,  is_partner: true,  quality_score: 87, save_count: 3102, is_open: true,  hours_open: '10:00', hours_close: '23:00' },
  { place_id: 'p7',  name_ko: '롯데호텔 서울',   name_en: 'Lotte Hotel Seoul',        coords_lat: 37.5640, coords_lng: 126.9815, display_domain: 'Hotels',      display_region: 'Seoul',    display_region_detail: 'Jung-gu',    is_trending: false, is_partner: true,  quality_score: 85, save_count: 691,  is_open: true,  hours_open: '00:00', hours_close: '23:59' },
  { place_id: 'p8',  name_ko: '동대문 DDP',      name_en: 'DDP Dongdaemun',           coords_lat: 37.5664, coords_lng: 127.0095, display_domain: 'Shopping',    display_region: 'Seoul',    display_region_detail: 'Jung-gu',    is_trending: true,  is_partner: false, quality_score: 90, save_count: 2088, is_open: false, hours_open: '10:00', hours_close: '20:00' },
  { place_id: 'p9',  name_ko: '국립중앙박물관',  name_en: 'National Museum of Korea', coords_lat: 37.5236, coords_lng: 126.9803, display_domain: 'Museums',     display_region: 'Seoul',    display_region_detail: 'Yongsan-gu', is_trending: false, is_partner: false, quality_score: 93, save_count: 1543, is_open: true,  hours_open: '10:00', hours_close: '18:00' },
  { place_id: 'p10', name_ko: '해운대 해수욕장',  name_en: 'Haeundae Beach',          coords_lat: 35.1587, coords_lng: 129.1600, display_domain: 'Parks',       display_region: 'Busan',    display_region_detail: 'Haeundae-gu', is_trending: true,  is_partner: false, quality_score: 96, save_count: 4210, is_open: true,  hours_open: '00:00', hours_close: '23:59' },
  { place_id: 'p11', name_ko: '감천문화마을',    name_en: 'Gamcheon Culture Village',  coords_lat: 35.0978, coords_lng: 129.0104, display_domain: 'Parks',       display_region: 'Busan',    display_region_detail: 'Saha-gu',     is_trending: true,  is_partner: false, quality_score: 89, save_count: 1832, is_open: true,  hours_open: '09:00', hours_close: '18:00' },
  { place_id: 'p12', name_ko: '성산일출봉',      name_en: 'Seongsan Ilchulbong',       coords_lat: 33.4583, coords_lng: 126.9421, display_domain: 'Parks',       display_region: 'Jeju',     display_region_detail: 'Seogwipo',    is_trending: true,  is_partner: false, quality_score: 98, save_count: 5621, is_open: true,  hours_open: '07:00', hours_close: '20:00' },
  { place_id: 'p13', name_ko: '인천 차이나타운',  name_en: 'Incheon Chinatown',        coords_lat: 37.4759, coords_lng: 126.6177, display_domain: 'Shopping',    display_region: 'Incheon',  display_region_detail: 'Jung-gu',     is_trending: false, is_partner: false, quality_score: 76, save_count: 421,  is_open: true,  hours_open: '10:00', hours_close: '22:00' },
  { place_id: 'p14', name_ko: '불국사',          name_en: 'Bulguksa Temple',           coords_lat: 35.7897, coords_lng: 129.3316, display_domain: 'Temples',     display_region: 'Gyeongju', display_region_detail: 'Gyeongju-si', is_trending: true,  is_partner: false, quality_score: 97, save_count: 3340, is_open: true,  hours_open: '07:00', hours_close: '18:00' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const region     = searchParams.get('region')
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) ?? []

  let pois = [...MOCK_POIS]
  if (region)          pois = pois.filter(p => p.display_region === region)
  if (categories.length > 0) pois = pois.filter(p => categories.includes(p.display_domain))

  // Enrich with full-snap detail (mock — real values come from
  // service.places_snapshot.description / address / extra_info).
  pois = pois.map(p => ({
    ...p,
    description: p.description
      ?? `${p.name_en} is a popular ${p.display_domain.toLowerCase().replace(/s$/, '')} in ${p.display_region}, a favourite stop for visitors exploring the area.`,
    address: p.address ?? `${p.display_region_detail ?? ''}, ${p.display_region}, South Korea`.replace(/^, /, ''),
  }))

  return NextResponse.json({ pois })
}
