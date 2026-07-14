import { NextResponse } from 'next/server'

export interface HomeTrendingPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  display_domain: string
  save_count: number
  primary_image_url: string | null
}

const MOCK: HomeTrendingPoi[] = [
  { poi_id: 'poi-t-01', name_ko: '홍대 거리',        name_en: 'Hongdae Street',           display_region: 'Mapo-gu, Seoul',        display_domain: 'K-Pop',     save_count: 1820, primary_image_url: null },
  { poi_id: 'poi-t-02', name_ko: '명동 성당',        name_en: 'Myeongdong Cathedral',     display_region: 'Jung-gu, Seoul',         display_domain: 'Heritage',  save_count: 1540, primary_image_url: null },
  { poi_id: 'poi-t-03', name_ko: '이태원 경리단길',   name_en: 'Gyeongnidan-gil',          display_region: 'Yongsan-gu, Seoul',     display_domain: 'Culture',   save_count: 1310, primary_image_url: null },
  { poi_id: 'poi-t-04', name_ko: '전주 한옥마을',    name_en: 'Jeonju Hanok Village',     display_region: 'Jeonju, North Jeolla',  display_domain: 'Heritage',  save_count: 1180, primary_image_url: null },
  { poi_id: 'poi-t-05', name_ko: '해운대 해수욕장',   name_en: 'Haeundae Beach',           display_region: 'Busan',                 display_domain: 'Nature',    save_count: 1050, primary_image_url: null },
]

export async function GET() {
  return NextResponse.json(MOCK)
}
