import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

export interface ProfileSavedPoi {
  poi_id: string
  name_preferred: string | null
  name_en: string | null
  name_ko: string | null
  display_region: string | null
}

// GET /api/profile/saved → BFF GET /me/bookmarks
interface BffBookmark {
  poi_id: number
  name_ko: string | null
  display_region: string | null
  translations: Record<string, { name?: string; description?: string }> | null
}

export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const bookmarks = await bffFetch<BffBookmark[]>('/me/bookmarks?limit=50', { token: auth.token })
    const items: ProfileSavedPoi[] = bookmarks.map(b => ({
      poi_id:         String(b.poi_id),
      name_preferred: null, // not exposed by BFF — getDisplayName falls back to name_en/name_ko
      name_en:        b.translations?.en?.name ?? null,
      name_ko:        b.name_ko ?? null,
      display_region: b.display_region ?? null,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
