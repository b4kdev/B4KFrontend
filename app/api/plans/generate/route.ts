import { NextResponse } from 'next/server'

export interface GenerateRequest {
  poi_ids: string[]
  // M5 — FL2 folder-level select (DEC-24). Client sends the selected folder ids
  // plus the resolved POI union; a real impl would resolve folder_ids → POIs
  // server-side. The mock uses poi_ids.
  folder_ids?: string[]
}

export interface GeneratedStop {
  poi_id:       string
  stop_order:   number
  duration_min: number
}

export interface GeneratedPlan {
  id:        string
  stops:     GeneratedStop[]
  transport: 'car' | 'public'
}

export async function POST(req: Request) {
  const body: GenerateRequest = await req.json().catch(() => ({ poi_ids: [] }))
  const { poi_ids } = body

  if (!Array.isArray(poi_ids) || poi_ids.length === 0) {
    return NextResponse.json({ error: 'poi_ids required' }, { status: 400 })
  }

  // FL2_02 clustering algorithm = dev friend (BLK-04). No data store wired yet —
  // derive stops from the actual poi_ids sent, in received order. duration_min
  // is an honest placeholder (no real per-POI estimate available yet).
  const stops: GeneratedStop[] = poi_ids.map((id, i) => ({
    poi_id:       id,
    stop_order:   i + 1,
    duration_min: 0,
  }))

  // Real impl: INSERT a new ai.plans draft (author = current user) and return its id.
  // No plan is actually persisted yet, so this id will not resolve on GET /api/plans/[id]
  // (honest 404) until a real data store is wired.
  return NextResponse.json({ id: `draft-${Date.now()}`, stops, transport: 'public' } satisfies GeneratedPlan)
}
