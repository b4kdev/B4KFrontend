import { NextRequest, NextResponse } from 'next/server'
import { bffFetch } from '@/lib/bff'

export interface HomeTrendingPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  display_domain: string
  save_count: number
  primary_image_url: string | null
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
}

interface BffTrendingPlace {
  poi_id: number
  name_ko: string
  primary_image_url: string | null
  save_count: number
  coords_lat: number
  coords_lng: number
  display_region: string | null
  domains: string[] | null
  translations: Record<string, { name?: string }> | null
}

// Trending now: the backend's weekly ranking over every category (saves and likes in the last 7
// days, publishable places only). No activity in the window, or a failed call, answers an empty
// list, so Home hides the row. The language comes in the query: the answer is cached at the CDN.
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') ?? 'en'
  const rows = await bffFetch<BffTrendingPlace[]>('/places/trending?limit=10', { token: null }).catch(() => [])
  return NextResponse.json<HomeTrendingPoi[]>((rows ?? []).map((p) => ({
    poi_id: String(p.poi_id),
    name_ko: p.name_ko,
    name_en: p.translations?.[locale]?.name ?? (locale === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
    display_region: p.display_region ?? '',
    display_domain: p.domains?.find((d) => d.startsWith('k-')) ?? '',
    save_count: p.save_count,
    primary_image_url: p.primary_image_url,
    coords_lat: p.coords_lat,
    coords_lng: p.coords_lng,
  })))
}
