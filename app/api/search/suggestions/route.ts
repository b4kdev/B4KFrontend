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

// Suggestions = place display names matching the query (BFF GET /places?q=).
// Contract: { suggestions: string[] } — see components/layout/TopNav.tsx SWR.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  // Optional lang (consumers don't send one today) — display-name rule:
  // translations[lang].name ?? name_ko
  const lang = searchParams.get('lang') ?? 'en'

  if (!q) return NextResponse.json({ suggestions: [] })

  try {
    const places = await bffFetch<BffPlace[]>(`/places?q=${encodeURIComponent(q)}&limit=8`)
    const suggestions = Array.from(new Set(
      (places ?? []).map(p => p.translations?.[lang]?.name ?? p.name_ko).filter(Boolean)
    )).slice(0, 8)
    return NextResponse.json({ suggestions })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
