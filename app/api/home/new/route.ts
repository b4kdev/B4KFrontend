import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'

// Interim content seed — cross-checked against B4K_POI_DB_IMPORT_CLEANED_1500.xlsx.
const SEED: HomeTrendingPoi[] = [
  { poi_id: 'KP-1090', name_ko: '커먼그라운드', name_en: 'Common Ground', display_region: 'Gwangjin-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: null, coords_lat: 37.54105555235208, coords_lng: 127.0656686600397 },
  { poi_id: 'KD010-009', name_ko: '학림다방', name_en: 'Hakrim Dabang', display_region: 'Jongno-gu, Seoul', display_domain: 'k-drama', save_count: 0, primary_image_url: null, coords_lat: 37.58195021892664, coords_lng: 127.0016574451341 },
  { poi_id: 'KB-EDIT-HN-004', name_ko: 'Tamburins Hannam Store', name_en: 'Tamburins Hannam Store', display_region: 'Yongsan-gu, Seoul', display_domain: 'k-beauty', save_count: 0, primary_image_url: null, coords_lat: 37.53591558501184, coords_lng: 126.9998393357537 },
  { poi_id: 'KC-GGI-104', name_ko: '이천 도자예술마을 예스파크', name_en: 'Icheon Ceramics Art Village (Yes Park)', display_region: 'Icheon, Gyeonggi', display_domain: 'k-culture', save_count: 0, primary_image_url: null, coords_lat: 37.29306176931404, coords_lng: 127.3856688627543 },
]

export async function GET() {
  return NextResponse.json(SEED)
}
