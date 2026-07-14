import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

// Server-side: would check session + compute affinity. Stub returns empty (hidden for guest / no history).
const MOCK: HomeTrendingPoi[] = [
  { poi_id: 'poi-r-01', name_ko: '익선동 한옥마을',   name_en: 'Ikseon-dong Hanok Village', display_region: 'Jongno-gu, Seoul',    display_domain: 'Culture',  save_count: 890,  primary_image_url: null },
  { poi_id: 'poi-r-02', name_ko: '망원동 카페 거리',  name_en: 'Mangwon Café Street',       display_region: 'Mapo-gu, Seoul',      display_domain: 'Food',     save_count: 740,  primary_image_url: null },
  { poi_id: 'poi-r-03', name_ko: '서촌 예술마을',     name_en: 'Seochon Art Village',       display_region: 'Jongno-gu, Seoul',    display_domain: 'Culture',  save_count: 610,  primary_image_url: null },
  { poi_id: 'poi-r-04', name_ko: '뚝섬 한강공원',    name_en: 'Ttukseom Han River Park',   display_region: 'Gwangjin-gu, Seoul',  display_domain: 'Nature',   save_count: 520,  primary_image_url: null },
]

export async function GET() {
  // Stub: always returns mock — real impl checks session, returns [] if no history
  return NextResponse.json(MOCK)
}
