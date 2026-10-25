import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized, BffError } from '@/lib/bff'
import {
  isNumericId,
  toBffMode,
  flattenBffDays,
  daysToPutPayload,
  groupPlacesIntoDays,
  mapBffToDetail,
  type BffItinerary,
} from '@/lib/itinerary'

// GET /api/plans/:id — itinerary detail for any viewer.
// BFF GET /itineraries/public/:id serves every case: public plans (anyone,
// incl. anonymous share links) and the owner's own private/draft plans
// (get_public_itinerary lets the owner through), and it is the only endpoint
// that carries author + viewer.is_liked/is_saved. 404 = missing or private
// non-owner, matching the stub's not_found contract.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  if (!id || !isNumericId(id)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  try {
    const bff = await bffFetch<BffItinerary>(`/itineraries/public/${id}`)
    return NextResponse.json(mapBffToDetail(bff))
  } catch (e) {
    if (e instanceof BffError && e.status === 404) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return bffErrorResponse(e)
  }
}

// PATCH /api/plans/:id — two consumer shapes:
// · { from_stop_order, transport_mode } (IT_01 LegRow): the BFF has no
//    per-stop endpoint, so read the itinerary, update that stop's travel_mode
//    and write the whole structure back (status preserved).
// · { is_published } (MapView publish step) → BFF POST /itineraries/:id/publish.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await req.json().catch(() => null) as
    { from_stop_order?: number; transport_mode?: string; is_published?: boolean } | null

  if (!id || !isNumericId(id)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Publish toggle (naming-sheet confirm publishes the freshly created plan)
  if (typeof body?.is_published === 'boolean' && body.from_stop_order === undefined) {
    try {
      await bffFetch(`/itineraries/${id}/publish`, {
        method: 'POST',
        body:   JSON.stringify({ is_public: body.is_published }),
        token:  auth.token,
      })
      return NextResponse.json({ success: true, is_published: body.is_published })
    } catch (e) {
      return bffErrorResponse(e)
    }
  }

  const mode = body?.transport_mode
  const from = body?.from_stop_order
  if (typeof from !== 'number' || !mode || !['car', 'public', 'walk'].includes(mode)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  try {
    // Owner check happens in the BFF: GET /itineraries/:id is owner-scoped, 404 = not mine.
    const bff = await bffFetch<BffItinerary>(`/itineraries/${id}`, { token: auth.token })
    const flat = flattenBffDays(bff.days)
    const target = flat.find(s => s.order === from)
    if (!target) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    target.place.travel_mode = toBffMode(mode)

    await bffFetch(`/itineraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        days:   daysToPutPayload(bff.days),
        status: bff.status === 'draft' ? 'draft' : 'confirmed',   // keep whatever it was
      }),
      token: auth.token,
    })
    return NextResponse.json({ success: true, from_stop_order: from, transport_mode: mode })
  } catch (e) {
    if (e instanceof BffError && e.status === 404) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return bffErrorResponse(e)
  }
}

// PUT /api/plans/:id   body: { title?, stops: [{ poi_id, stop_order, duration_min, day }] }
// Save changes to an existing plan (edit mode): BFF PUT /itineraries/:id replaces its days, so the
// plan keeps its id, link, likes and saves. A stop that stays keeps its travel mode and note.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  if (!id || !isNumericId(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json().catch(() => ({})) as {
    title?: string
    stops?: Array<{ poi_id?: string | number; stop_order?: number; duration_min?: number; day?: number }>
  }
  const stops = (Array.isArray(body.stops) ? body.stops : [])
    .filter(s => s.poi_id !== undefined && Number.isFinite(Number(s.poi_id)))
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (a.s.stop_order ?? a.i + 1) - (b.s.stop_order ?? b.i + 1))
    .map(({ s }) => s)
  if (stops.length === 0) return NextResponse.json({ error: 'stops required' }, { status: 400 })

  try {
    // Owner-scoped read: 404 = not mine. Also gives the kept stops' travel mode and note.
    const current = await bffFetch<BffItinerary>(`/itineraries/${id}`, { token: auth.token })
    const kept = new Map(flattenBffDays(current.days).map(({ place }) => [Number(place.poi_id), place]))
    const places = stops.map(s => {
      const prev = kept.get(Number(s.poi_id))
      return {
        poi_id:       Number(s.poi_id),
        duration_min: typeof s.duration_min === 'number' && s.duration_min > 0 ? s.duration_min : null,
        travel_mode:  prev?.travel_mode ?? 'walking',
        note:         prev?.note ?? null,
        day:          s.day,
      }
    })
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined
    await bffFetch(`/itineraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        days:   groupPlacesIntoDays(places),
        ...(title ? { title } : {}),
        status: current.status === 'draft' ? 'draft' : 'confirmed',
      }),
      token: auth.token,
    })
    return NextResponse.json({ success: true, id })
  } catch (e) {
    if (e instanceof BffError && e.status === 404) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return bffErrorResponse(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  if (!isNumericId(id)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  try {
    await bffFetch(`/itineraries/${id}`, { method: 'DELETE', token: auth.token })
    return NextResponse.json({ success: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
