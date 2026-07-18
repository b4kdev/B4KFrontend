import { NextResponse } from 'next/server'

export interface SavedPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  primary_image_url: string | null
  quality_score: number
  saved_at: string
  // SC-31 — pin sync needs coords; poi_id reuses the /api/map/pois universe
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

// No data yet — real saves/folders/plans come from social.poi_saves, social.poi_folders,
// social.plan_saves, ai.plans once backend is wired. "All Saved" (folder-000) always exists
// per DEC-24, even with zero saves — it is a fixed, non-deletable default folder.
const EMPTY: SavedData = {
  pois: [],
  folders: [
    { id: 'folder-000', name: 'All Saved', created_at: new Date(0).toISOString(), is_default: true, pois: [] },
  ],
  plans: [],
  myPlans: [],
}

export async function GET() {
  return NextResponse.json(EMPTY)
}
