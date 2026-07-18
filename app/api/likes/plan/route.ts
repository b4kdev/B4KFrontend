import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/likes/plan   body: { plan_id: string }  → BFF POST /itineraries/:id/like
// DELETE /api/likes/plan body: { plan_id: string }  → BFF POST /itineraries/:id/like
// The BFF endpoint is a toggle — the response carries the BFF's actual resulting
// state ({liked, like_count}) so the client can reconcile if intent and outcome
// diverge (e.g. double-fire).

interface ToggleLikeResult {
  itinerary_id: number
  liked: boolean
  like_count: number
}

async function toggleLike(planId: string, token: string) {
  const id = Number(planId)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid_plan_id' }, { status: 400 })
  }
  try {
    const data = await bffFetch<ToggleLikeResult>(`/itineraries/${id}/like`, {
      method: 'POST',
      token,
    })
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
  return toggleLike(String(body.plan_id), auth.token)
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleLike(String(body.plan_id), auth.token)
}
