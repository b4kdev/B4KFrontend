import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffFetch, bffErrorResponse } from '@/lib/bff'
import { pickEntityTitle } from '@/lib/entity-i18n'
import { collectionHasContent } from '@/lib/collections'

// BFF GET /search/suggest: the same groups as GET /search, 5 each, nothing recorded.
interface BffSuggest {
  places: Array<{
    poi_id: number
    name_ko: string
    primary_image_url: string | null
    display_region: string | null
    display_district?: string | null
    translations: Record<string, { name?: string }> | null
  }>
  explore: Array<{
    slug: string
    entity_id: number
    cover_images?: string[]
    name_ko: string
    name_en?: string | null
    translations?: Record<string, { name?: string; description?: string }>
    entity_type: string
    metadata?: { primary_type?: string; runtime_kind?: string }
  }>
  plans: Array<{ itinerary_id: number; title: string | null; total_days: number; total_places: number; cover_image_url: string | null }>
}

export interface SearchSuggestions {
  /** Place, plan and page names, for older callers. */
  suggestions: string[]
  places: { id: string; name: string; district: string | null; region: string | null; imageSrc: string | null }[]
  plans: { id: string; name: string; days: number; stops: number; imageSrc: string | null }[]
  explore: { slug: string; name: string; primaryType: string | null }[]
}

// Suggestions while typing, grouped as drawn: places (photo, area), plans (days and stops) and
// Explore pages (collections).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 50)
  // Display-name rule: translations[lang].name, falling back to English then Korean.
  const lang = searchParams.get('lang') ?? (await cookies()).get('NEXT_LOCALE')?.value ?? 'en'

  const empty: SearchSuggestions = { suggestions: [], places: [], plans: [], explore: [] }
  if (!q) return NextResponse.json(empty)

  try {
    const found = await bffFetch<BffSuggest>(`/search/suggest?q=${encodeURIComponent(q)}`, { token: null })
    const places = (found.places ?? []).map(p => ({
      id: String(p.poi_id),
      name: p.translations?.[lang]?.name ?? (lang === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
      district: p.display_district ?? null,
      region: p.display_region ?? null,
      imageSrc: p.primary_image_url,
    }))
    const plans = (found.plans ?? []).filter(p => p.title).map(p => ({
      id: String(p.itinerary_id),
      name: p.title as string,
      days: p.total_days ?? 0,
      stops: p.total_places ?? 0,
      imageSrc: p.cover_image_url,
    }))
    // A collection with no places is left out: its page has nothing to show.
    const matched = (found.explore ?? []).filter(e => e.entity_type === 'collection')
    const shown = await Promise.all(matched.map(collectionHasContent))
    const explore = matched.filter((_, i) => shown[i]).map(e => ({
      slug: e.slug,
      name: pickEntityTitle(e, lang),
      primaryType: e.metadata?.primary_type ?? null,
    }))
    const suggestions = Array.from(new Set([...places.map(p => p.name), ...plans.map(p => p.name), ...explore.map(e => e.name)])).slice(0, 8)
    return NextResponse.json({ suggestions, places, plans, explore } satisfies SearchSuggestions)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
