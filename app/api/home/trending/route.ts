import { NextResponse } from 'next/server'
import { withDbPoiIds } from '@/lib/db-poi-mapping'

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

// No trending data exists before launch (no real saves or likes), and a hand-picked list must
// not be labelled Trending: the endpoint returns nothing, so Home hides the row. Replace with
// the real backend ranking once it exists (weekly saves and likes, publishable places only).
const TRENDING: HomeTrendingPoi[] = []

export async function GET() {
  return NextResponse.json(withDbPoiIds(TRENDING))
}
