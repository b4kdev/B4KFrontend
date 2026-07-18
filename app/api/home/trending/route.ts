import { NextResponse } from 'next/server'

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

export async function GET() {
  const empty: HomeTrendingPoi[] = []
  return NextResponse.json(empty)
}
