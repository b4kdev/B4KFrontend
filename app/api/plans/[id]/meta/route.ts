import { NextRequest, NextResponse } from 'next/server'
import { bffFetch, getSessionAuth, BffError } from '@/lib/bff'
import { isNumericId, type BffItinerary } from '@/lib/itinerary'

export interface PlanMeta {
  isOwner: boolean
}

// SC-35 (S-DEGJDE) — ownership is a per-session authorization check, kept out
// of the main GET /api/plans/[id] payload on purpose: that response is the
// same for every viewer (share links, previews) and must never carry a
// client-trusted owner flag. This route re-derives it from the real session
// on every call.
//
// Contract (API-CONTRACT.md): returns 200 always, never 401/404 here.
// Derivation: BFF GET /itineraries/:id is owner-scoped (404 = not mine), so a
// 2xx means the session user owns the plan. On 404 fall back to the public
// endpoint's viewer.is_owner; anything else resolves to false.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const notOwner = NextResponse.json({ isOwner: false } satisfies PlanMeta)

  if (!id || !isNumericId(id)) return notOwner

  const auth = await getSessionAuth()
  if (!auth) return notOwner

  try {
    await bffFetch<BffItinerary>(`/itineraries/${id}`, { token: auth.token })
    return NextResponse.json({ isOwner: true } satisfies PlanMeta)
  } catch (e) {
    if (!(e instanceof BffError) || e.status !== 404) return notOwner
  }

  try {
    const pub = await bffFetch<BffItinerary>(`/itineraries/public/${id}`, { token: auth.token })
    return NextResponse.json({ isOwner: pub.viewer?.is_owner ?? false } satisfies PlanMeta)
  } catch {
    return notOwner
  }
}
