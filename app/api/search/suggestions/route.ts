import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

// BFF GET /places item (api.list_places)
interface BffPlace {
  poi_id: number
  name_ko: string
  primary_image_url: string | null
  like_count: number
  save_count: number
  coords_lat: number
  coords_lng: number
  display_region: string | null
  domains: string[] | null
  translations: Record<string, { name?: string; description?: string }> | null
}

// BFF GET /itineraries/public item (api.list_public_itineraries) — same shape
// used by app/api/search/route.ts. The BFF has no plan text search, so (like
// the results-page route) we fetch the public list and match titles here.
interface BffPublicItinerary {
  itinerary_id: number
  title: string
}

// Suggestions balanced across entity types (SPEC-14): place names + plan
// titles matching the query, capped at 8 total. Was places-only.
// Contract: { suggestions: string[] } — see components/layout/TopNav.tsx SWR.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  // Optional lang (consumers don't send one today) — display-name rule:
  // translations[lang].name ?? name_ko
  const lang = searchParams.get('lang') ?? 'en'

  if (!q) return NextResponse.json({ suggestions: [] })

  try {
    const needle = q.toLowerCase()
    const [places, plans] = await Promise.all([
      bffFetch<BffPlace[]>(`/places?q=${encodeURIComponent(q)}&limit=5`),
      bffFetch<BffPublicItinerary[]>('/itineraries/public?sort=popular&limit=50'),
    ])

    const placeNames = (places ?? [])
      .map(p => p.translations?.[lang]?.name ?? p.name_ko)
      .filter(Boolean)
      .slice(0, 5)

    const planTitles = (plans ?? [])
      .filter(p => p.title?.toLowerCase().includes(needle))
      .map(p => p.title)
      .slice(0, 3)

    const suggestions = Array.from(new Set([...placeNames, ...planTitles])).slice(0, 8)
    return NextResponse.json({ suggestions })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
