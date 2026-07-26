import { NextResponse } from 'next/server'
import type { HomeTrendingPoi } from '../trending/route'
import { cldUrl } from '@/lib/cloudinary-image'

// Interim content seed — cross-checked against B4K_POI_DB_IMPORT_CLEANED_1500.xlsx.
// Server-side: real impl checks session + computes affinity, returns [] if no history.
// This stub does not implement that check yet (it didn't before this seed either) —
// still always returns the same list regardless of session.
const SEED: HomeTrendingPoi[] = [
  { poi_id: 'KP-0811', name_ko: 'AK플라자 홍대', name_en: 'AK Plaza Hongdae', display_region: 'Mapo-gu, Seoul', display_domain: 'k-pop', save_count: 0, primary_image_url: cldUrl('/images/home/recommended/KP-0811_ak-plaza-hongdae.webp'), coords_lat: 37.55780854901018, coords_lng: 126.9264078382983 },
  { poi_id: 'KD016-012', name_ko: '용인대장금테마파크', name_en: 'Yongin Dae Jang Geum Park (Set)', display_region: 'Yongin, Gyeonggi', display_domain: 'k-drama', save_count: 0, primary_image_url: cldUrl('/images/home/recommended/KD016-012_yongin-daejanggeum-park.webp'), coords_lat: 37.1211916935391, coords_lng: 127.337579430944 },
  { poi_id: 'KB-NEW-210', name_ko: '박승철헤어스투디오 청담점', name_en: 'Park Seung Chul Hair Studio Cheongdam', display_region: 'Gangnam-gu, Seoul', display_domain: 'k-beauty', save_count: 0, primary_image_url: cldUrl('/images/home/recommended/KB-NEW-210_park-seungchul-hair-studio.webp'), coords_lat: 37.52142537302042, coords_lng: 127.0491175495873 },
  { poi_id: 'KD027-014', name_ko: '남산골한옥마을', name_en: 'Namsangol Hanok Village', display_region: 'Jung-gu, Seoul', display_domain: 'k-culture', save_count: 0, primary_image_url: cldUrl('/images/home/recommended/KD027-014_namsangol-hanok-village.webp'), coords_lat: 37.55954236008625, coords_lng: 126.9947382826091 },
]

export async function GET() {
  return NextResponse.json(SEED)
}
