import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface OtherUserTrip {
  id: string
  title: string
  day_count: number
  stop_count: number
  save_count: number
  is_saved: boolean
}

// BFF GET /profiles/:id/itineraries item (api.list_user_public_itineraries)
interface BffPublicItineraryItem {
  itinerary_id: number
  title: string
  total_days: number
  total_places: number
  save_count: number
}

interface BffProfileItineraries {
  itineraries: BffPublicItineraryItem[]
  visible: boolean
}

// GET /api/profile/[id]/trips → BFF GET /profiles/:id/itineraries
// Note: the backend list doesn't report per-viewer save state, so is_saved is
// always false here until the BFF adds that field.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
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
      is_saved: false,
    }))
    return NextResponse.json({ items })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
