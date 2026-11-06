import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/likes/plan   body: { plan_id: string }  → BFF POST /itineraries/:id/like
// DELETE /api/likes/plan body: { plan_id: string }  → BFF POST /itineraries/:id/like
// The BFF endpoint is a toggle, so the route asks for a state: POST = liked, DELETE = not liked.
// When the toggle lands on the other state (e.g. an action finished after sign-in on a plan already
// liked), it toggles once more, so an action never undoes the state it asked for.

interface ToggleLikeResult {
  itinerary_id: number
  liked: boolean
  like_count: number
}

async function toggleLike(planId: string, token: string, want: boolean) {
  const id = Number(planId)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid_plan_id' }, { status: 400 })
  }
  try {
    const toggle = () => bffFetch<ToggleLikeResult>(`/itineraries/${id}/like`, {
      method: 'POST',
      token,
    })
    let data = await toggle()
    if (data.liked !== want) data = await toggle()
    return NextResponse.json({ ok: true, liked: data.liked, like_count: data.like_count })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleLike(String(body.plan_id), auth.token, true)
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleLike(String(body.plan_id), auth.token, false)
}
