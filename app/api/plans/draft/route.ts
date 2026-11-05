import { NextResponse } from 'next/server'
import { bffFetch, bffErrorResponse, getSessionAuth, unauthorized } from '@/lib/bff'
import { fetchDbDraft, groupPlacesIntoDays } from '@/lib/itinerary'
import { PLACE_SOURCES, PLAN_FLOWS, type PlaceSource, type PlanFlow } from '@/lib/place-source'

export interface PlanDraft {
  id: string
  /** null: not named yet; the name field starts empty. */
  title: string | null
  stop_count: number
  updated_at: string
}

// Consumers (useDraftMigration / useQuickAddToPlan / MapView autosave) send
// the localStorage DraftPlan shape: { stops: MapPoi[], durations, days?, name? }.
// days = poi_id → day tab (1–7); absent (older clients) → everything on day 1.
interface DraftBody {
  stops?:     Array<{ poi_id?: string | number }>
  durations?: Record<string, number>
  days?:      Record<string, number>
  name?:      string
  /** poi_id → where the place was found; kept on each stop. */
  sources?:   Record<string, string>
  /** How the plan started (manual, quick_plan, from_saved). */
  flow?:      string
}

// GET /api/plans/draft — the account's single working draft (BFF
// GET /me/itineraries?status=draft, newest first). null when none exists.
export async function GET() {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()
  try {
    const draft = await fetchDbDraft(auth.token)
    if (!draft) return NextResponse.json(null)
    return NextResponse.json({
      id:         String(draft.itinerary_id),
      title:      draft.title,
      stop_count: draft.total_places ?? 0,
      updated_at: draft.updated_at ?? draft.created_at ?? new Date().toISOString(),
    } satisfies PlanDraft)
  } catch (e) {
    return bffErrorResponse(e)
  }
}

// POST /api/plans/draft — upsert the account draft from the builder state.
// The body is an ordered flat stop list (+ per-stop durations), so this maps
// to the days-based save (BFF PUT/POST /itineraries, status:'draft') rather
// than POST /itineraries/plan — re-clustering would discard the user's order
// and durations. If a DB draft already exists it is replaced in place
// (PUT /itineraries/:id) instead of piling up new drafts on every autosave.
export async function POST(request: Request) {
  const auth = await getSessionAuth()
  if (!auth) return unauthorized()

  const body = await request.json().catch(() => ({})) as DraftBody
  const stops = Array.isArray(body.stops) ? body.stops : []
  const places = stops
    .filter(s => s?.poi_id !== undefined && Number.isFinite(Number(s.poi_id)))
    .map(s => {
      const duration = body.durations?.[String(s.poi_id)]
      const source = body.sources?.[String(s.poi_id)]
      return {
        poi_id:       Number(s.poi_id),
        duration_min: typeof duration === 'number' && duration > 0 ? Math.round(duration) : null,
        day:          body.days?.[String(s.poi_id)],
        // Where the place was found; an unknown value is left out.
        ...(PLACE_SOURCES.includes(source as PlaceSource) ? { source } : {}),
      }
    })
  if (places.length === 0) {
    return NextResponse.json({ error: 'stops required' }, { status: 400 })
  }

  try {
    const existing = await fetchDbDraft(auth.token)
    const payload = JSON.stringify({
      days:   groupPlacesIntoDays(places),
      title:  typeof body.name === 'string' && body.name.trim() ? body.name : null,
      status: 'draft',
      // Left out when unknown: the backend then keeps the draft's flow.
      ...(PLAN_FLOWS.includes(body.flow as PlanFlow) ? { source: body.flow } : {}),
    })

    if (existing) {
      await bffFetch(`/itineraries/${existing.itinerary_id}`, {
        method: 'PUT', body: payload, token: auth.token,
      })
    } else {
      await bffFetch('/itineraries', {
        method: 'POST', body: payload, token: auth.token,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
