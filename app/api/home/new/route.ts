import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

const MOCK: HomeTrendingPoi[] = [
  { poi_id: 'poi-n-01', name_ko: '성수 카페 거리',   name_en: 'Seongsu Café District',    display_region: 'Seongdong-gu, Seoul',   display_domain: 'Culture',  save_count: 320,  primary_image_url: null },
  { poi_id: 'poi-n-02', name_ko: '을지로 노가리 골목', name_en: 'Euljiro Snack Alley',     display_region: 'Jung-gu, Seoul',         display_domain: 'Food',     save_count: 248,  primary_image_url: null },
  { poi_id: 'poi-n-03', name_ko: '양평 두물머리',    name_en: 'Dumulmeori, Yangpyeong',   display_region: 'Yangpyeong, Gyeonggi',  display_domain: 'Nature',   save_count: 195,  primary_image_url: null },
  { poi_id: 'poi-n-04', name_ko: '춘천 레고랜드',    name_en: 'LEGOLAND Korea Resort',    display_region: 'Chuncheon, Gangwon',    display_domain: 'Theme',    save_count: 164,  primary_image_url: null },
  { poi_id: 'poi-n-05', name_ko: '강릉 커피 거리',   name_en: 'Gangneung Coffee Street',  display_region: 'Gangneung, Gangwon',    display_domain: 'Food',     save_count: 141,  primary_image_url: null },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
