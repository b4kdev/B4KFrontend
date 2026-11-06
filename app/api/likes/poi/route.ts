import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// GET /api/likes/poi?ids=1,2,3 — which of these places the signed-in person liked → BFF GET
//   /me/likes?ids= ({ liked_ids }); numeric ids only, at most 300 a call
// POST /api/likes/poi — like a POI → BFF POST /likes/toggle
// DELETE /api/likes/poi — unlike a POI → BFF POST /likes/toggle
// The BFF endpoint is a toggle, so the route asks for a state: POST = liked, DELETE = not liked.
// When the toggle lands on the other state (already liked, e.g. a like finished after sign-in), it
// toggles once more, so an action never undoes the state it asked for.

interface ToggleLikeResult {
  action: 'added' | 'removed'
  poi_id: number
  like_count: number
}

async function toggleLike(poiId: string | number, token: string, want: boolean) {
  try {
    const toggle = () => bffFetch<ToggleLikeResult>('/likes/toggle', {
      method: 'POST',
      body: JSON.stringify({ poi_id: Number(poiId) }),
      token,
    })
    let data = await toggle()
    if ((data.action === 'added') !== want) data = await toggle()
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

export async function GET(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((x) => /^\d+$/.test(x)).slice(0, 300)
  if (!ids.length) return NextResponse.json({ liked_ids: [] })
  try {
    const data = await bffFetch<{ liked_ids: number[] }>(`/me/likes?ids=${ids.join(',')}`, { token: auth.token })
    return NextResponse.json({ liked_ids: (data.liked_ids ?? []).map(String) })
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
  return toggleLike(poi_id, auth.token, true)
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
  return toggleLike(poi_id, auth.token, false)
}
