import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized, BffError } from '@/lib/bff'
import {
  isNumericId,
  flattenBffDays,
  daysToPutPayload,
  toBffMode,
  type BffItinerary,
} from '@/lib/itinerary'

// PATCH /api/plans/:id/stops/:stopOrder — update transport_mode for a stop (owner only).
// The BFF has no per-stop endpoint, so: GET /itineraries/:id (owner-scoped —
// 404 means missing or someone else's), locate the stop by its global order
// (days flattened, day order → visit order), set travel_mode, then PUT the
// whole structure back with the original status preserved.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; stopOrder: string } }
) {
  const { id, stopOrder } = params
  if (!id || !stopOrder) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }
  const body = await req.json().catch(() => ({}))
  const { transport_mode } = body as { transport_mode?: string }
  if (!transport_mode || !['car', 'public', 'walk'].includes(transport_mode)) {
    return NextResponse.json({ error: 'invalid_transport_mode' }, { status: 400 })
  }

  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const order = Number(stopOrder)
  if (!isNumericId(id) || !Number.isInteger(order) || order < 1) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const bff = await bffFetch<BffItinerary>(`/itineraries/${id}`, { token: auth.token })
    const target = flattenBffDays(bff.days).find(s => s.order === order)
    if (!target) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    target.place.travel_mode = toBffMode(transport_mode)

    await bffFetch(`/itineraries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        days:   daysToPutPayload(bff.days),
        status: bff.status === 'draft' ? 'draft' : 'confirmed',
      }),
      token: auth.token,
    })
    return NextResponse.json({ success: true, id, stop_order: order, transport_mode })
  } catch (e) {
    if (e instanceof BffError && e.status === 404) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return bffErrorResponse(e)
  }
}
