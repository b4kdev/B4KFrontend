import { NextResponse } from 'next/server'
import { mockCoordsFor } from '@/lib/mock-geo'
import type { HomeTrendingPoi } from '../trending/route'

// category param: 'k-pop' | 'k-drama' | 'k-beauty' | 'k-culture' | undefined (all)
const MOCK_ALL: Omit<HomeTrendingPoi, 'coords_lat' | 'coords_lng'>[] = [
  { poi_id: 'poi-e-01', name_ko: 'SM 엔터테인먼트',   name_en: 'SM Town Coex Artium',      display_region: 'Gangnam-gu, Seoul',     display_domain: 'K-Pop',    save_count: 2100, primary_image_url: null },
  { poi_id: 'poi-e-02', name_ko: '롯데월드',          name_en: 'Lotte World',              display_region: 'Songpa-gu, Seoul',      display_domain: 'K-Drama',  save_count: 1870, primary_image_url: null },
  { poi_id: 'poi-e-03', name_ko: '청담동 뷰티 거리',  name_en: 'Cheongdam Beauty District', display_region: 'Gangnam-gu, Seoul',    display_domain: 'K-Beauty', save_count: 1540, primary_image_url: null },
  { poi_id: 'poi-e-04', name_ko: '인사동 문화거리',   name_en: 'Insadong Cultural Street',  display_region: 'Jongno-gu, Seoul',     display_domain: 'K-Culture', save_count: 1360, primary_image_url: null },
  { poi_id: 'poi-e-05', name_ko: '방탄소년단 공원',   name_en: 'BTS ARMY Corner Park',     display_region: 'Yongsan-gu, Seoul',    display_domain: 'K-Pop',    save_count: 2940, primary_image_url: null },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const filtered = category
    ? MOCK_ALL.filter(p => p.display_domain.toLowerCase().replace(' ', '-') === category.toLowerCase())
    : MOCK_ALL
  const items = filtered.length ? filtered : MOCK_ALL
  const enriched: HomeTrendingPoi[] = items.map(p => {
    const { lat, lng } = mockCoordsFor(p.poi_id, p.display_region)
    return { ...p, coords_lat: lat, coords_lng: lng }
  })
  return NextResponse.json(enriched)
}
