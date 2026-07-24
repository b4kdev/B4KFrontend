import { NextResponse } from 'next/server'

export interface HomeTrendingPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  display_domain: string
  save_count: number
  primary_image_url: string | null
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
}

// Interim content seed — every row cross-checked against
// B4K_POI_DB_IMPORT_CLEANED_1500.xlsx (poi_id/coords are the real DB values).
// save_count is 0 for all rows: no real engagement data exists pre-launch and
// this file does not fabricate social-proof numbers. primary_image_url is null
// pending Cloudinary wiring. Replace this seed with the real BFF call once
// dev friend wires /places (or an equivalent trending endpoint) — see DEC-50.
const SEED: HomeTrendingPoi[] = [
  { poi_id: 'KP-207', name_ko: '올림픽공원 KSPO DOME', name_en: 'KSPO Dome Olympic Park', display_region: 'Songpa-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: null, coords_lat: 37.5192612328545, coords_lng: 127.1273998904141 },
  { poi_id: 'KD016-007', name_ko: '광장시장', name_en: 'Gwangjang Market', display_region: 'Jongno-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: null, coords_lat: 37.57005529646949, coords_lng: 126.9989472822363 },
  { poi_id: 'KB-DER-GN-005', name_ko: 'Abijou Clinic Gangnam', name_en: 'Abijou Clinic Gangnam', display_region: 'Seocho-gu, Seoul', display_domain: 'k-beauty', save_count: 0, primary_image_url: null, coords_lat: 37.49864716138882, coords_lng: 127.0262645904912 },
  { poi_id: 'KD016-003', name_ko: '문경새재 오픈세트장', name_en: 'Mungyeong Saejae Open Set', display_region: 'Mungyeong, Gyeongsangbuk-do', display_domain: 'k-drama', save_count: 0, primary_image_url: null, coords_lat: 36.7713996802656, coords_lng: 128.074072026373 },
  { poi_id: 'KD016-001', name_ko: '창덕궁', name_en: 'Changdeokgung Palace', display_region: 'Jongno-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: null, coords_lat: 37.57964694739535, coords_lng: 126.9909998067713 },
  { poi_id: 'KP-058', name_ko: '강남 댄스 스튜디오', name_en: 'Gangnam Dance Studio Zone', display_region: 'Gangnam-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: null, coords_lat: 37.5271629824846, coords_lng: 127.039432806226 },
]

export async function GET() {
  return NextResponse.json(SEED)
}
