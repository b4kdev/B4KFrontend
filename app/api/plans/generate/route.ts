import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import { flattenBffDays, type BffItinerary } from '@/lib/itinerary'

export interface GenerateRequest {
  poi_ids: string[]
  // M5 — FL2 folder-level select (DEC-24). Client sends the selected folder ids
  // plus the resolved POI union; the BFF plans from the resolved poi_ids.
  folder_ids?: string[]
}

export interface GeneratedStop {
  poi_id:       string
  stop_order:   number
  duration_min: number
}

export interface GeneratedPlan {
  id:        string
  stops:     GeneratedStop[]
  transport: 'car' | 'public'
}

const MAX_PLACES = 40 // FRD DEC-27 — mirrored by the BFF/DB

// POST /api/plans/generate — BFF POST /itineraries/plan: clusters the places
// into days and persists a real draft itinerary. The returned id resolves on
// GET /api/plans/[id] (the stub's throwaway draft-<ts> ids are gone).
export async function POST(req: Request) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body: GenerateRequest = await req.json().catch(() => ({ poi_ids: [] }))
  const { poi_ids } = body

  if (!Array.isArray(poi_ids) || poi_ids.length === 0) {
    return NextResponse.json({ error: 'poi_ids required' }, { status: 400 })
  }
  const place_ids = poi_ids
    .map(id => Number(id))
    .filter(n => Number.isFinite(n))
  if (place_ids.length === 0) {
    return NextResponse.json({ error: 'poi_ids required' }, { status: 400 })
  }
  if (place_ids.length > MAX_PLACES) {
    return NextResponse.json({ error: 'max_stops_exceeded', max: MAX_PLACES }, { status: 400 })
  }

  try {
    const bff = await bffFetch<BffItinerary>('/itineraries/plan', {
      method: 'POST',
      body:   JSON.stringify({ place_ids }),
      token:  auth.token,
    })

    // Flatten the clustered days back into the flat stop contract. The plan
    // RPC leaves duration_min unset — keep the stub's honest 0 placeholder.
    const flat = flattenBffDays(bff.days)
    const stops: GeneratedStop[] = flat.map(({ place, order }) => ({
      poi_id:       String(place.poi_id),
      stop_order:   order,
      duration_min: place.duration_min ?? 0,
    }))

    // Contract only allows car|public; generated plans default to walking
    // legs, so anything non-driving reports as 'public' (consumer only uses id).
    const firstMode = flat[0]?.place.travel_mode
    const transport: GeneratedPlan['transport'] = firstMode === 'driving' ? 'car' : 'public'

    return NextResponse.json({
      id: String(bff.itinerary_id),
      stops,
      transport,
    } satisfies GeneratedPlan)
  } catch (e) {
    return bffErrorResponse(e)
  }
}
