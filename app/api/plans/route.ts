import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import type { BffItinerary } from '@/lib/itinerary'

export interface PlanStop {
  poi_id:      string
  stop_order:  number
  duration_min: number
  transport_mode: 'car' | 'public'
}

export interface Plan {
  id:          string
  title:       string
  stop_count:  number
  is_published: boolean
  is_partner:  boolean
  created_at:  string
}

export interface PlansData {
  plans: Plan[]
}

// list_my_itineraries item (GET /me/itineraries) — header-only summary
interface BffMyItinerary {
  itinerary_id: number
  title:        string
  status:       string
  is_public:    boolean
  is_partner:   boolean
  total_places: number
  created_at:   string
}

// GET /api/plans — my itineraries (BFF GET /me/itineraries).
// Anonymous keeps the stub's 200 { plans: [] } contract — a signed-out
// visitor simply has no plans.
export async function GET(req: Request) {
  const auth = await getSessionAuth()
  if (!auth) return NextResponse.json({ plans: [] } satisfies PlansData)

  const url = new URL(req.url)
  const qs = new URLSearchParams()
  const status = url.searchParams.get('status')
  if (status === 'draft' || status === 'confirmed') qs.set('status', status)
  const limit  = url.searchParams.get('limit')
  const offset = url.searchParams.get('offset')
  if (limit  && /^\d+$/.test(limit))  qs.set('limit', limit)
  if (offset && /^\d+$/.test(offset)) qs.set('offset', offset)

  try {
    const query = qs.toString()
    const items = await bffFetch<BffMyItinerary[]>(
      `/me/itineraries${query ? `?${query}` : ''}`,
      { token: auth.token },
    )
    const plans: Plan[] = (items ?? []).map(it => ({
      id:           String(it.itinerary_id),
      title:        it.title,
      stop_count:   it.total_places ?? 0,
      is_published: it.is_public ?? false,
      is_partner:   it.is_partner ?? false,
      created_at:   it.created_at,
    }))
    return NextResponse.json({ plans } satisfies PlansData)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// POST /api/plans — create a plan from the map builder (MapView DEC-29 body:
// { title, stops: [{ poi_id, stop_order, duration_min }], is_published }).
// Maps to BFF POST /itineraries with a single-day structure (the builder body
// carries only a flat stop order — no day assignment survives the contract).
// status 'confirmed': this is an explicit user save, and only confirmed plans
// can be published by the follow-up PATCH { is_published: true }.
export async function POST(req: Request) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => ({})) as {
    title?: string
    stops?: Array<{ poi_id?: string | number; stop_order?: number; duration_min?: number }>
    is_published?: boolean
  }

  const stops = Array.isArray(body.stops) ? body.stops : []
  const places = stops
    .filter(s => s.poi_id !== undefined && Number.isFinite(Number(s.poi_id)))
    .map((s, i) => ({
      poi_id:       Number(s.poi_id),
      visit_order:  typeof s.stop_order === 'number' ? s.stop_order : i + 1,
      duration_min: typeof s.duration_min === 'number' && s.duration_min > 0 ? s.duration_min : null,
    }))
  if (places.length === 0) {
    return NextResponse.json({ error: 'stops required' }, { status: 400 })
  }

  try {
    const created = await bffFetch<BffItinerary>('/itineraries', {
      method: 'POST',
      body: JSON.stringify({
        days:   [{ day_number: 1, places }],
        title:  typeof body.title === 'string' && body.title.trim() ? body.title : null,
        status: 'confirmed',
      }),
      token: auth.token,
    })

    if (body.is_published === true) {
      await bffFetch(`/itineraries/${created.itinerary_id}/publish`, {
        method: 'POST',
        body:   JSON.stringify({ is_public: true }),
        token:  auth.token,
      })
    }

    const plan: Plan = {
      id:           String(created.itinerary_id),
      title:        created.title,
      stop_count:   created.total_places ?? places.length,
      is_published: body.is_published === true || (created.is_public ?? false),
      is_partner:   created.is_partner ?? false,
      created_at:   created.created_at ?? new Date().toISOString(),
    }
    return NextResponse.json({ plan }, { status: 201 })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
