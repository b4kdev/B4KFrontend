import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized, BffError } from '@/lib/bff'
import {
  isNumericId,
  toBffMode,
  flattenBffDays,
  daysToPutPayload,
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
//  · { from_stop_order, transport_mode } (IT_01 LegRow, DEC-13): the BFF has no
//    per-stop endpoint, so read the itinerary, update that stop's travel_mode
//    and write the whole structure back (status preserved).
//  · { is_published } (MapView DEC-29 publish step) → BFF POST /itineraries/:id/publish.
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
