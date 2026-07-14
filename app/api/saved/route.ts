import { NextResponse } from 'next/server'

export interface SavedPoi {
  place_id: string
  name_ko: string
  name_en: string
  display_region: string
  primary_image_url: string | null
  quality_score: number
  saved_at: string
  // SC-31 — pin sync needs coords; place_id reuses the /api/map/pois universe
  // (a save is a join row against that same POI table, never a separate list).
  coords_lat: number
  coords_lng: number
}

export interface SavedFolder {
  id: string
  name: string
  pois: SavedPoi[]
  created_at: string
  is_default?: boolean // "All Saved" — not renamable/deletable (DEC-24)
}

/** Plans saved from other users — social.plan_saves */
export interface SavedPlan {
  id: string
  title: string
  stop_count: number
  duration_days: number
  cover_image_url: string | null
  author_name: string
  author_avatar_url: string | null
  likes_count: number
  saves_count: number
  saved_at: string
}

/** Own published plans + active draft — ai.plans WHERE author_id = current_user */
export interface MyPlan {
  id: string
  title: string
  stop_count: number
  duration_days: number
  cover_image_url: string | null
  is_draft: boolean
  likes_count: number
  saves_count: number
  updated_at: string
}

export interface SavedData {
  pois:     SavedPoi[]
  folders:  SavedFolder[]
  plans:    SavedPlan[]
  myPlans:  MyPlan[]
}

const MOCK_POIS: SavedPoi[] = [
  { place_id: 'p1',  name_ko: '경복궁',         name_en: 'Gyeongbokgung Palace',   display_region: 'Seoul', primary_image_url: '/mock-images/gyeongbok.png',      quality_score: 95, saved_at: '2026-06-08T10:00:00Z', coords_lat: 37.5796, coords_lng: 126.9770 },
  { place_id: 'p6',  name_ko: '명동 먹자골목',   name_en: 'Myeongdong Food Street',  display_region: 'Seoul', primary_image_url: '/mock-images/pork_soup.png',      quality_score: 87, saved_at: '2026-06-07T14:30:00Z', coords_lat: 37.5636, coords_lng: 126.9831 },
  { place_id: 'p8',  name_ko: '동대문 DDP',      name_en: 'DDP Dongdaemun',          display_region: 'Seoul', primary_image_url: '/mock-images/kbbq.png',           quality_score: 90, saved_at: '2026-06-06T09:15:00Z', coords_lat: 37.5664, coords_lng: 127.0095 },
  { place_id: 'p12', name_ko: '성산일출봉',      name_en: 'Seongsan Ilchulbong',     display_region: 'Jeju',  primary_image_url: '/mock-images/palace_spring.png',  quality_score: 98, saved_at: '2026-06-05T16:00:00Z', coords_lat: 33.4583, coords_lng: 126.9421 },
]

const MOCK: SavedData = {
  pois: MOCK_POIS,
  folders: [
    { id: 'folder-000', name: 'All Saved',     created_at: '2026-05-30T00:00:00Z', is_default: true, pois: MOCK_POIS },
    { id: 'folder-001', name: 'Seoul Trip',    created_at: '2026-06-01T00:00:00Z', pois: [MOCK_POIS[0], MOCK_POIS[1], MOCK_POIS[2]] },
    { id: 'folder-002', name: 'Jeju Island',   created_at: '2026-06-03T00:00:00Z', pois: [MOCK_POIS[3]] },
  ],
  plans: [
    { id: 'sp-001', title: 'Seoul in 3 Days — K-Pop & History', stop_count: 8, duration_days: 3, cover_image_url: null, author_name: 'JiYeon K.',  author_avatar_url: null, likes_count: 142, saves_count: 89, saved_at: '2026-06-08T11:00:00Z' },
    { id: 'sp-002', title: 'Jeju Island Hidden Gems',            stop_count: 5, duration_days: 2, cover_image_url: null, author_name: 'Takumi M.', author_avatar_url: null, likes_count: 78,  saves_count: 45, saved_at: '2026-06-07T18:00:00Z' },
  ],
  myPlans: [
    { id: 'my-001', title: 'My Seoul Weekend',    stop_count: 6, duration_days: 2, cover_image_url: null, is_draft: false, likes_count: 12, saves_count: 7,  updated_at: '2026-06-09T14:00:00Z' },
    { id: 'my-002', title: 'Untitled plan',       stop_count: 3, duration_days: 1, cover_image_url: null, is_draft: true,  likes_count: 0,  saves_count: 0,  updated_at: '2026-06-10T08:30:00Z' },
  ],
}

export async function GET() {
  return NextResponse.json(MOCK)
}
