import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface HomeTopPlan {
  id: string
  title: string
  author_name: string
  likes_count: number
  saves_count: number
  cover_image_url: string | null
}

export interface HomeSeasonalPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  category: string
  primary_image_url: string | null
}

export interface HomeData {
  topPlans: HomeTopPlan[]
  seasonalPois: HomeSeasonalPoi[]
}

// BFF GET /itineraries/public item (api.list_public_itineraries)
interface BffPublicItinerary {
  itinerary_id: number
  title: string
  is_partner: boolean
  region: string | null
  total_days: number
  total_places: number
  like_count: number
  save_count: number
  cover_image_url: string | null
  author: { user_id: number; name: string | null; avatar_url: string | null } | null
  published_at: string | null
}

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

export async function GET() {
  // next-intl locales (i18n/routing.ts) — translations JSONB keys must match this
  // exact casing (e.g. 'zh-CN' not 'zh_CN') or the lookup below silently misses.
  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'en'

  try {
    const [plans, places] = await Promise.all([
      bffFetch<BffPublicItinerary[]>('/itineraries/public?sort=popular&limit=6'),
      bffFetch<BffPlace[]>('/places?limit=10'),
    ])

    const topPlans: HomeTopPlan[] = (plans ?? []).map(p => ({
      id: String(p.itinerary_id),
      title: p.title,
      author_name: p.author?.name ?? '',
      likes_count: p.like_count ?? 0,
      saves_count: p.save_count ?? 0,
      cover_image_url: p.cover_image_url,
    }))

    const seasonalPois: HomeSeasonalPoi[] = (places ?? []).map(p => ({
      poi_id: String(p.poi_id),
      name_ko: p.name_ko,
      // Display-name rule: translations[locale].name, falling back to English
      // then Korean — matches hooks/useMapPois.ts's mapPlace(). Note: this
      // whole seasonalPois field is currently dead code — TrendingSpots.tsx
      // calls /api/home/trending instead, which is a stub. Fixed anyway for
      // consistency; not independently testable until that section is wired up.
      name_en: p.translations?.[locale]?.name ?? (locale === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
      display_region: p.display_region ?? '',
      category: p.domains?.[0] ?? '',
      primary_image_url: p.primary_image_url,
    }))

    return NextResponse.json<HomeData>({ topPlans, seasonalPois })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
