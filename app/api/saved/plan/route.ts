import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'

// POST /api/saved/plan   body: { plan_id: string }  → BFF POST /itineraries/:id/save
// DELETE /api/saved/plan body: { plan_id: string }  → BFF POST /itineraries/:id/save
// The BFF endpoint is a toggle — the response carries the BFF's actual resulting
// state ({saved, save_count}) so the client can reconcile if intent and outcome
// diverge (e.g. double-fire).

interface ToggleSaveResult {
  itinerary_id: number
  saved: boolean
  save_count: number
}

async function toggleSave(planId: string, token: string) {
  const id = Number(planId)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid_plan_id' }, { status: 400 })
  }
  try {
    const data = await bffFetch<ToggleSaveResult>(`/itineraries/${id}/save`, {
      method: 'POST',
      token,
    })
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
  return toggleSave(String(body.plan_id), auth.token)
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  const body = await req.json().catch(() => ({}))
  if (!body?.plan_id) return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  return toggleSave(String(body.plan_id), auth.token)
}
