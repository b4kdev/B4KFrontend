import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/likes/poi — like a POI → BFF POST /likes/toggle
// DELETE /api/likes/poi — unlike a POI → BFF POST /likes/toggle
// The BFF endpoint is a toggle — the response carries the BFF's actual resulting
// state (liked) so the client can reconcile if intent and outcome diverge.

interface ToggleLikeResult {
  action: 'added' | 'removed'
  poi_id: number
  like_count: number
}

async function toggleLike(poiId: string | number, token: string) {
  try {
    const data = await bffFetch<ToggleLikeResult>('/likes/toggle', {
      method: 'POST',
      body: JSON.stringify({ poi_id: Number(poiId) }),
      token,
    })
    return NextResponse.json({
      success: true,
      poi_id: poiId,
      liked: data.action === 'added',
      like_count: data.like_count,
    })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const { poi_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  // Home/Explore seed content ships content-sheet codes ('KP-207') as a display id,
  // not the live DB's numeric poi_id — Number(poi_id) would silently collapse to NaN.
  if (!Number.isFinite(Number(poi_id))) return NextResponse.json({ error: 'invalid_poi_id' }, { status: 400 })
  return toggleLike(poi_id, auth.token)
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const { poi_id } = body
  if (!poi_id) return NextResponse.json({ error: 'missing_poi_id' }, { status: 400 })
  // Home/Explore seed content ships content-sheet codes ('KP-207') as a display id,
  // not the live DB's numeric poi_id — Number(poi_id) would silently collapse to NaN.
  if (!Number.isFinite(Number(poi_id))) return NextResponse.json({ error: 'invalid_poi_id' }, { status: 400 })
  return toggleLike(poi_id, auth.token)
}
