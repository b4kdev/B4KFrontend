import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import { fetchDbDraft, type BffItinerary } from '@/lib/itinerary'

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
//
// BLK-08: the autosave path (POST /api/plans/draft) already has a status:'draft'
// row for this account by the time the user hits "Save Plan" — check for it
// first and PUT-convert that same row to status:'confirmed' instead of always
// POSTing a fresh one, or every confirmed save orphans its own draft row.
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

  const title = typeof body.title === 'string' && body.title.trim() ? body.title : null

  try {
    const existingDraft = await fetchDbDraft(auth.token)

    let planId: number
    let planTitle: string
    let createdAt: string

    if (existingDraft) {
      await bffFetch(`/itineraries/${existingDraft.itinerary_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          days:   [{ day_number: 1, places }],
          title,
          status: 'confirmed',
        }),
        token: auth.token,
      })
      planId    = existingDraft.itinerary_id
      planTitle = title ?? existingDraft.title
      createdAt = existingDraft.created_at ?? existingDraft.updated_at ?? new Date().toISOString()
    } else {
      const created = await bffFetch<BffItinerary>('/itineraries', {
        method: 'POST',
        body: JSON.stringify({
          days:   [{ day_number: 1, places }],
          title,
          status: 'confirmed',
        }),
        token: auth.token,
      })
      planId    = created.itinerary_id
      planTitle = created.title
      createdAt = created.created_at ?? new Date().toISOString()
    }

    if (body.is_published === true) {
      await bffFetch(`/itineraries/${planId}/publish`, {
        method: 'POST',
        body:   JSON.stringify({ is_public: true }),
        token:  auth.token,
      })
    }

    const plan: Plan = {
      id:           String(planId),
      title:        planTitle,
      stop_count:   places.length,
      is_published: body.is_published === true,
      is_partner:   false,
      created_at:   createdAt,
    }
    return NextResponse.json({ plan }, { status: existingDraft ? 200 : 201 })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
