import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface OtherUserTrip {
  id: string
  title: string
  day_count: number
  stop_count: number
  save_count: number
  /** The first stop that has a photo; null when no stop has one. */
  cover_image_url: string | null
  is_saved: boolean
}

// BFF GET /profiles/:id/itineraries item (api.list_user_public_itineraries)
interface BffPublicItineraryItem {
  itinerary_id: number
  title: string
  total_days: number
  total_places: number
  save_count: number
  cover_image_url: string | null
}

interface BffProfileItineraries {
  itineraries: BffPublicItineraryItem[]
  visible: boolean
}

// GET /api/profile/[id]/trips → BFF GET /profiles/:id/itineraries
// Note: the backend list doesn't report per-viewer save state, so is_saved is
// always false here until the BFF adds that field.
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  try {
    const data = await bffFetch<BffProfileItineraries>(
      `/profiles/${params.id}/itineraries`,
    )
    const items: OtherUserTrip[] = (data.itineraries ?? []).map((i) => ({
      id: String(i.itinerary_id),
      title: i.title,
      day_count: i.total_days,
      stop_count: i.total_places,
      save_count: i.save_count,
      cover_image_url: i.cover_image_url ?? null,
      is_saved: false,
    }))
    // A plain list, as the profile screen reads it.
    return NextResponse.json(items)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
