import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import { isNumericId } from '@/lib/itinerary'

export interface ProfileTrip {
  id: string
  title: string
  is_published: boolean
  like_count: number
  save_count: number
  thumbnail_url: string | null
  stop_count: number
  created_at: string
}

// BFF GET /me/itineraries item (api.list_my_itineraries)
interface BffMyItinerary {
  itinerary_id: number
  title: string
  is_public: boolean
  like_count: number
  save_count: number
  cover_image_url: string | null
  total_places: number
  created_at: string
}

// GET /api/profile/trips → BFF GET /me/itineraries
export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const data = await bffFetch<BffMyItinerary[]>('/me/itineraries', { token: auth.token })
    const trips: ProfileTrip[] = (data ?? []).map((i) => ({
      id: String(i.itinerary_id),
      title: i.title,
      is_published: i.is_public,
      like_count: i.like_count,
      save_count: i.save_count,
      thumbnail_url: i.cover_image_url,
      stop_count: i.total_places,
      created_at: i.created_at,
    }))
    return NextResponse.json(trips)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// DELETE /api/profile/trips?id=:id → BFF DELETE /itineraries/:id
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !isNumericId(id)) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  }
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    await bffFetch(`/itineraries/${id}`, { method: 'DELETE', token: auth.token })
    return NextResponse.json({ success: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
