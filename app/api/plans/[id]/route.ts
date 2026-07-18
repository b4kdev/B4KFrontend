import { NextRequest, NextResponse } from 'next/server'

export interface ItineraryStop {
  stop_order: number
  day: number | null
  duration_min: number
  transport_mode: 'car' | 'public' | 'walk' | null
  notes: string | null
  poi: {
    poi_id: string
    name_preferred: string | null
    name_en: string
    name_ko: string
    primary_image_url: string | null
    display_domain: string
    coords_lat: number
    coords_lng: number
  }
}

export interface ItineraryLeg {
  from_stop_order: number
  to_stop_order: number
  estimated_duration_s: number
  distance_m: number
  transport_mode: 'car' | 'public' | 'walk'
}

export interface ItineraryRelated {
  id: string
  title: string
  like_count: number
  save_count: number
  stop_count: number
  thumbnail_url: string | null
}

export interface ItineraryDetail {
  id: string
  title: string
  is_partner: boolean
  is_published: boolean
  share_url: string | null
  like_count: number
  save_count: number
  total_duration_min: number
  distance_m: number | null
  author: {
    id: string
    name_preferred: string | null
    name_en: string | null
    name_ko: string | null
    avatar_url: string | null
  }
  stops: ItineraryStop[]
  legs: ItineraryLeg[]
  related: ItineraryRelated[]
  viewer: {
    is_liked: boolean
    is_saved: boolean
  }
}

// No data store wired yet — every id is honestly "not found" until a real
// plan can actually be looked up.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  void params
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}

// Owner sets transport mode per leg (DEC-13) — real impl recomputes via TMAP (24h cache)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  void params
  const body = await req.json().catch(() => null) as
    { from_stop_order?: number; transport_mode?: string } | null
  const mode = body?.transport_mode
  const from = body?.from_stop_order
  if (typeof from !== 'number' || !mode || !['car', 'public', 'walk'].includes(mode)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // No data store wired yet — no plan exists to apply this to.
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  // No data store wired yet — no plan exists to delete.
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
