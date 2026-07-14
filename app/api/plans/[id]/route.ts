import { NextRequest, NextResponse } from 'next/server'
import { MOCK } from '@/lib/mock/plan-detail'

export interface ItineraryStop {
  stop_order: number
  day: number | null
  duration_min: number
  transport_mode: 'car' | 'public' | 'walk' | null
  notes: string | null
  poi: {
    place_id: string
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const plan = MOCK[params.id]
  if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!plan.is_published) return NextResponse.json({ error: 'private' }, { status: 403 })
  return NextResponse.json(plan)
}

// Owner sets transport mode per leg (DEC-13) — real impl recomputes via TMAP (24h cache)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const plan = MOCK[params.id]
  if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json().catch(() => null) as
    { from_stop_order?: number; transport_mode?: string } | null
  const mode = body?.transport_mode
  const from = body?.from_stop_order
  if (typeof from !== 'number' || !mode || !['car', 'public', 'walk'].includes(mode)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const leg = plan.legs.find(l => l.from_stop_order === from)
  if (!leg) return NextResponse.json({ error: 'leg_not_found' }, { status: 404 })
  leg.transport_mode = mode as ItineraryLeg['transport_mode']
  return NextResponse.json({ success: true, leg })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  return NextResponse.json({ success: true, id })
}
