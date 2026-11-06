import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/saved/plan   body: { plan_id: string }  → BFF POST /itineraries/:id/save
// DELETE /api/saved/plan body: { plan_id: string }  → BFF POST /itineraries/:id/save
// The BFF endpoint is a toggle, so the route asks for a state: POST = saved, DELETE = not saved.
// When the toggle lands on the other state (e.g. an action finished after sign-in on a plan already
// saved), it toggles once more, so an action never undoes the state it asked for.

interface ToggleSaveResult {
  itinerary_id: number
  saved: boolean
  save_count: number
}

async function toggleSave(planId: string, token: string, want: boolean) {
  const id = Number(planId)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid_plan_id' }, { status: 400 })
  }
  try {
    const toggle = () => bffFetch<ToggleSaveResult>(`/itineraries/${id}/save`, {
      method: 'POST',
      token,
    })
    let data = await toggle()
    if (data.saved !== want) data = await toggle()
    return NextResponse.json({ ok: true, saved: data.saved, save_count: data.save_count })
  } catch (e) {
    return bffErrorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleSave(String(body.plan_id), auth.token, true)
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleSave(String(body.plan_id), auth.token, false)
}
