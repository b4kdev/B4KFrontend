import { NextRequest, NextResponse } from 'next/server'

export interface MapPoi {
  poi_id: string
  name_ko: string
  name_en: string
  coords_lat: number
  coords_lng: number
  display_domain: string
  display_region: string
  display_region_detail?: string
  is_trending: boolean
  is_partner: boolean
  quality_score: number
  // Detail fields (DEC-31: no ratings/reviews — save count only)
  save_count?: number
  is_open?: boolean
  hours_open?: string
  hours_close?: string
  // Full-snap detail (POIBottomSheet full state, S-DEVEQK)
  description?: string
  address?: string
  website_url?: string
  // SC-33 (LP_11-16 media) — service.places_snapshot.primary_image_url
  primary_image_url?: string
}

// No data yet — real data is service.places_snapshot, queried server-side.
const MOCK_POIS: MapPoi[] = []

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const region     = searchParams.get('region')
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) ?? []

  let pois = [...MOCK_POIS]
  if (region)          pois = pois.filter(p => p.display_region === region)
  if (categories.length > 0) pois = pois.filter(p => categories.includes(p.display_domain))

  return NextResponse.json({ pois })
}
