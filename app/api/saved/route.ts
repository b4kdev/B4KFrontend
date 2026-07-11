import { NextResponse } from 'next/server'

export interface SavedPoi {
  place_id: string
  name_ko: string
  name_en: string
  display_region: string
  primary_image_url: string | null
  quality_score: number
  saved_at: string
}

export interface SavedFolder {
  id: string
  name: string
  pois: SavedPoi[]
  created_at: string
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
  { place_id: 'sv-001', name_ko: '경복궁',              name_en: 'Gyeongbokgung Palace',  display_region: '서울', primary_image_url: null, quality_score: 97, saved_at: '2026-06-08T10:00:00Z' },
  { place_id: 'sv-002', name_ko: '광장시장',             name_en: 'Gwangjang Market',       display_region: '서울', primary_image_url: null, quality_score: 96, saved_at: '2026-06-07T14:30:00Z' },
  { place_id: 'sv-003', name_ko: 'HYBE 인사이트',        name_en: 'HYBE Insight',           display_region: '서울', primary_image_url: null, quality_score: 91, saved_at: '2026-06-06T09:15:00Z' },
  { place_id: 'sv-004', name_ko: '이니스프리 제주 하우스', name_en: 'Innisfree Jeju House',  display_region: '제주', primary_image_url: null, quality_score: 87, saved_at: '2026-06-05T16:00:00Z' },
]

const MOCK: SavedData = {
  pois: MOCK_POIS,
  folders: [
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
