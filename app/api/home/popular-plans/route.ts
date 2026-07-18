import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface HomePopularPlan {
  id: string
  title: string
  author_name: string
  stop_count: number
  save_count: number
  cover_image_url: string | null
  is_partner: boolean
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

export async function GET() {
  try {
    const plans = await bffFetch<BffPublicItinerary[]>('/itineraries/public?sort=popular&limit=20')
    const out: HomePopularPlan[] = (plans ?? []).map(p => ({
      id: String(p.itinerary_id),
      title: p.title,
      author_name: p.author?.name ?? '',
      stop_count: p.total_places ?? 0,
      save_count: p.save_count ?? 0,
      cover_image_url: p.cover_image_url,
      is_partner: !!p.is_partner,
    }))
    return NextResponse.json(out)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
