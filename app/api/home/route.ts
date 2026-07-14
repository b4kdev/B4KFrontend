import { NextResponse } from 'next/server'

export interface HomeTopPlan {
  id: string
  title: string
  author_name: string
  likes_count: number
  saves_count: number
  cover_image_url: string | null
}

export interface HomeSeasonalPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  category: string
  primary_image_url: string | null
}

export interface HomeData {
  topPlans: HomeTopPlan[]
  seasonalPois: HomeSeasonalPoi[]
}

const MOCK_TOP_PLANS: HomeTopPlan[] = [
  { id: 'plan-home-01', title: 'Seoul BTS Trail · 5 Stops', author_name: '@yuna_travels', likes_count: 284, saves_count: 91,  cover_image_url: null },
  { id: 'plan-home-02', title: 'Jeju Sunrise to Sunset',    author_name: '@jiho_explore',  likes_count: 197, saves_count: 64,  cover_image_url: null },
  { id: 'plan-home-03', title: 'Gyeongju in a Day',         author_name: '@seoultaste',    likes_count: 152, saves_count: 48,  cover_image_url: null },
]

const MOCK_SEASONAL_POIS: HomeSeasonalPoi[] = [
  { poi_id: 'poi-s-01', name_ko: '경복궁',         name_en: 'Gyeongbokgung Palace',      display_region: 'Jongno-gu, Seoul',      category: 'Heritage', primary_image_url: null },
  { poi_id: 'poi-s-02', name_ko: '보성 녹차밭',    name_en: 'Boseong Green Tea Fields',  display_region: 'Boseong, South Jeolla', category: 'Nature',   primary_image_url: null },
  { poi_id: 'poi-s-03', name_ko: 'N 서울타워',     name_en: 'N Seoul Tower',             display_region: 'Namsan, Seoul',         category: 'Landmark', primary_image_url: null },
  { poi_id: 'poi-s-04', name_ko: '전주 한옥마을',  name_en: 'Jeonju Hanok Village',      display_region: 'Jeonju, North Jeolla', category: 'Culture',  primary_image_url: null },
  { poi_id: 'poi-s-05', name_ko: '북한산 국립공원', name_en: 'Bukhansan National Park',  display_region: 'Seoul Metropolitan',    category: 'Nature',   primary_image_url: null },
  { poi_id: 'poi-s-06', name_ko: '해운대 해수욕장', name_en: 'Haeundae Beach',           display_region: 'Busan',                 category: 'Beach',    primary_image_url: null },
]

export async function GET() {
  return NextResponse.json<HomeData>({
    topPlans: MOCK_TOP_PLANS,
    seasonalPois: MOCK_SEASONAL_POIS,
  })
}
