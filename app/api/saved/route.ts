import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth } from '@/lib/bff'

export interface SavedPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  primary_image_url: string | null
  quality_score: number
  saved_at: string
  // SC-31 — pin sync needs coords; poi_id reuses the same BFF `places` universe
  // the map draws from (a save is a join row against that POI table, never a separate list).
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

// Signed-out shape — "All Saved" (folder-000) always exists per DEC-24, even with
// zero saves. The signed-in shape is built from the BFF (real Default folder UUID).
const EMPTY: SavedData = {
  pois: [],
  folders: [
    { id: 'folder-000', name: 'All Saved', created_at: new Date(0).toISOString(), is_default: true, pois: [] },
  ],
  plans: [],
  myPlans: [],
}

// ── BFF response shapes (B4KBackend/API_FRONTEND.md) ──
interface BffBookmark {
  poi_id: number
  name_ko: string | null
  primary_image_url: string | null
  like_count: number
  coords_lat: number
  coords_lng: number
  display_region: string | null
  translations: Record<string, { name?: string; description?: string }> | null
  bookmarked_at: string
  folder_id: string
  folder_name: string
}

interface BffFolder {
  folder_id: string
  name: string
  is_default: boolean
  count: number
  created_at: string
  updated_at: string
}

interface BffSavedItinerary {
  itinerary_id: number
  title: string | null
  is_partner: boolean
  total_days: number
  total_places: number
  like_count: number
  save_count: number
  cover_image_url: string | null
  author: { user_id: number; name: string | null; avatar_url: string | null } | null
  saved_at: string
}

interface BffMyItinerary {
  itinerary_id: number
  title: string | null
  status: 'draft' | 'confirmed'
  total_days: number
  total_places: number
  like_count: number
  save_count: number
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

function toSavedPoi(b: BffBookmark): SavedPoi {
  return {
    poi_id:            String(b.poi_id),
    name_ko:           b.name_ko ?? '',
    name_en:           b.translations?.en?.name ?? b.name_ko ?? '',
    display_region:    b.display_region ?? '',
    primary_image_url: b.primary_image_url,
    quality_score:     0, // not exposed by BFF bookmark list
    saved_at:          b.bookmarked_at,
    coords_lat:        b.coords_lat,
    coords_lng:        b.coords_lng,
  }
}

export async function GET() {
  const auth = await getSessionAuth()
  // Signed out — same shape the stub returned; the page's auth gate handles prompting.
  if (!auth) return NextResponse.json(EMPTY)

  try {
    const [bookmarks, folders, savedItins, myItins] = await Promise.all([
      bffFetch<BffBookmark[]>('/me/bookmarks?limit=100',       { token: auth.token }),
      bffFetch<BffFolder[]>('/me/bookmark-folders',            { token: auth.token }),
      bffFetch<BffSavedItinerary[]>('/me/saved-itineraries',   { token: auth.token }),
      bffFetch<BffMyItinerary[]>('/me/itineraries',            { token: auth.token }),
    ])

    const pois = bookmarks.map(toSavedPoi)

    const poisByFolder = new Map<string, SavedPoi[]>()
    for (const b of bookmarks) {
      const list = poisByFolder.get(b.folder_id) ?? []
      list.push(toSavedPoi(b))
      poisByFolder.set(b.folder_id, list)
    }

    const data: SavedData = {
      pois,
      folders: folders.map(f => ({
        id:         f.folder_id,
        // BFF names the default folder "Default" — keep the frontend's fixed
        // "All Saved" label (DEC-24).
        name:       f.is_default ? 'All Saved' : f.name,
        pois:       poisByFolder.get(f.folder_id) ?? [],
        created_at: f.created_at,
        is_default: f.is_default,
      })),
      plans: savedItins.map(p => ({
        id:                String(p.itinerary_id),
        title:             p.title ?? '',
        stop_count:        p.total_places,
        duration_days:     p.total_days,
        cover_image_url:   p.cover_image_url,
        author_name:       p.author?.name ?? '',
        author_avatar_url: p.author?.avatar_url ?? null,
        likes_count:       p.like_count,
        saves_count:       p.save_count,
        saved_at:          p.saved_at,
      })),
      myPlans: myItins.map(p => ({
        id:              String(p.itinerary_id),
        title:           p.title ?? '',
        stop_count:      p.total_places,
        duration_days:   p.total_days,
        cover_image_url: p.cover_image_url,
        is_draft:        p.status === 'draft',
        likes_count:     p.like_count,
        saves_count:     p.save_count,
        updated_at:      p.updated_at,
      })),
    }
    return NextResponse.json(data)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
